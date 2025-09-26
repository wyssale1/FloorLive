import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { SwissUnihockeyApiClient } from './swissUnihockeyApi.js';
import { CacheService } from './cacheService.js';
import { Game } from '../types/domain.js';

export class WebSocketService {
  private wss: WebSocketServer;
  private apiClient: SwissUnihockeyApiClient;
  private cache: CacheService;
  private clients: Set<WebSocket> = new Set();
  private liveGameUpdateInterval: NodeJS.Timeout | null = null;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.apiClient = new SwissUnihockeyApiClient();
    this.cache = new CacheService();
    
    this.setupWebSocketServer();
    this.startLiveGameUpdates();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket connection established');
      this.clients.add(ws);

      // Send initial live games data
      this.sendLiveGamesUpdate(ws);

      // Handle client messages
      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleClientMessage(ws, message);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log('WebSocket connection closed');
        this.clients.delete(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    console.log('WebSocket server initialized');
  }

  private async handleClientMessage(ws: WebSocket, message: any): Promise<void> {
    switch (message.type) {
      case 'subscribe_game':
        // Subscribe to specific game updates
        if (message.gameId) {
          await this.sendGameUpdate(ws, message.gameId);
        }
        break;

      case 'subscribe_live':
        // Subscribe to live games updates
        await this.sendLiveGamesUpdate(ws);
        break;

      case 'ping':
        // Respond to ping with pong
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;

      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: `Unknown message type: ${message.type}`
        }));
    }
  }

  private async sendLiveGamesUpdate(ws?: WebSocket): Promise<void> {
    try {
      const liveGames = await this.apiClient.getCurrentGames();
      
      const message = {
        type: 'live_games_update',
        data: liveGames,
        timestamp: Date.now()
      };

      if (ws) {
        // Send to specific client
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      } else {
        // Broadcast to all clients
        this.broadcast(message);
      }

      // Update cache
      if (liveGames.length > 0) {
        this.cache.setLiveGames(liveGames);
      }

    } catch (error) {
      console.error('Error sending live games update:', error);
    }
  }

  private async sendGameUpdate(ws: WebSocket, gameId: string): Promise<void> {
    try {
      const game = await this.apiClient.getGameDetails(gameId);
      const events = await this.apiClient.getGameEvents(gameId);

      if (game) {
        const message = {
          type: 'game_update',
          data: {
            game,
            events
          },
          timestamp: Date.now()
        };

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      }
    } catch (error) {
      console.error(`Error sending game update for ${gameId}:`, error);
    }
  }

  private broadcast(message: any): void {
    const messageStr = JSON.stringify(message);
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      } else {
        // Remove closed connections
        this.clients.delete(client);
      }
    });
  }

  private startLiveGameUpdates(): void {
    // Update live games every 30 seconds
    this.liveGameUpdateInterval = setInterval(async () => {
      if (this.clients.size > 0) {
        console.log('Broadcasting live games update to', this.clients.size, 'clients');
        await this.sendLiveGamesUpdate();
      }
    }, 30000); // 30 seconds

    console.log('Live game updates started (30s interval)');
  }

  public async broadcastGameUpdate(gameId: string): Promise<void> {
    if (this.clients.size === 0) return;

    try {
      const game = await this.apiClient.getGameDetails(gameId);
      const events = await this.apiClient.getGameEvents(gameId);

      if (game) {
        const message = {
          type: 'game_update',
          data: {
            game,
            events
          },
          gameId,
          timestamp: Date.now()
        };

        this.broadcast(message);
      }
    } catch (error) {
      console.error(`Error broadcasting game update for ${gameId}:`, error);
    }
  }

  public getConnectedClients(): number {
    return this.clients.size;
  }

  public cleanup(): void {
    if (this.liveGameUpdateInterval) {
      clearInterval(this.liveGameUpdateInterval);
      this.liveGameUpdateInterval = null;
    }

    this.clients.forEach((client) => {
      client.close();
    });
    this.clients.clear();

    this.wss.close();
    console.log('WebSocket service cleaned up');
  }
}