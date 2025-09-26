import { useEffect, useRef, useState } from 'react';
import type { Game, GameEvent } from '../types/domain';

interface WebSocketMessage {
  type: 'live_games_update' | 'game_update' | 'pong' | 'error';
  data?: any;
  gameId?: string;
  timestamp?: number;
  message?: string;
}

export interface WebSocketHookResult {
  isConnected: boolean;
  liveGames: Game[];
  sendMessage: (message: any) => void;
  gameUpdates: Record<string, { game: Game; events: GameEvent[] }>;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

export function useWebSocket(): WebSocketHookResult {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [liveGames, setLiveGames] = useState<Game[]>([]);
  const [gameUpdates, setGameUpdates] = useState<Record<string, { game: Game; events: GameEvent[] }>>({});

  const sendMessage = (message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  useEffect(() => {
    const connect = () => {
      try {
        ws.current = new WebSocket(WS_URL);

        ws.current.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          
          // Subscribe to live games updates
          sendMessage({ type: 'subscribe_live' });
        };

        ws.current.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            
            switch (message.type) {
              case 'live_games_update':
                if (message.data && Array.isArray(message.data)) {
                  setLiveGames(message.data);
                }
                break;
                
              case 'game_update':
                if (message.data && message.gameId) {
                  setGameUpdates(prev => ({
                    ...prev,
                    [message.gameId!]: {
                      game: message.data.game,
                      events: message.data.events || []
                    }
                  }));
                }
                break;
                
              case 'pong':
                // Handle ping/pong for connection health
                break;
                
              case 'error':
                console.error('WebSocket error message:', message.message);
                break;
                
              default:
                console.log('Unknown WebSocket message type:', message.type);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.current.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          
          // Attempt to reconnect after 3 seconds
          setTimeout(connect, 3000);
        };

        ws.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setTimeout(connect, 3000);
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  // Send ping every 30 seconds to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      sendMessage({ type: 'ping' });
    }, 30000);

    return () => clearInterval(pingInterval);
  }, [isConnected]);

  return {
    isConnected,
    liveGames,
    sendMessage,
    gameUpdates
  };
}

// Hook for subscribing to specific game updates
export function useGameWebSocket(gameId: string) {
  const { isConnected, sendMessage, gameUpdates } = useWebSocket();
  
  useEffect(() => {
    if (isConnected && gameId) {
      // Subscribe to specific game updates
      sendMessage({ type: 'subscribe_game', gameId });
    }
  }, [isConnected, gameId, sendMessage]);
  
  return {
    isConnected,
    gameUpdate: gameUpdates[gameId] || null
  };
}