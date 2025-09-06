import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import gamesRouter from './routes/games.js';
import teamsRouter from './routes/teams.js';
import leaguesRouter from './routes/leagues.js';
import logosRouter from './routes/logos.js';
import playersRouter from './routes/players.js';
import { WebSocketService } from './services/websocketService.js';
import { SchedulerService } from './services/schedulerService.js';
import { setupGracefulShutdown } from './utils/gracefulShutdown.js';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: process.env.NODE_ENV === 'production' 
    ? { policy: "same-origin" }
    : { policy: "cross-origin" }
}));
// CORS configuration - allow Tailscale access when HOST=0.0.0.0
const corsOrigin = () => {
  if (process.env.NODE_ENV === 'production') {
    return ['https://floorlive.alexander-wyss.ch', 'http://floorlive.alexander-wyss.ch'];
  }
  // Development mode
  if (process.env.HOST === '0.0.0.0') {
    // Allow all origins when binding to all interfaces (Tailscale mode)
    return true;
  }
  // Standard localhost development
  return ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
};

app.use(cors({
  origin: corsOrigin(),
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/games', gamesRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/leagues', leaguesRouter);
app.use('/api/logos', logosRouter);
app.use('/api/players', playersRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'FloorLive Backend API',
    version: '1.0.0',
    description: 'Backend API for FloorLive - Swiss Unihockey tracker',
    endpoints: {
      games: '/api/games',
      live_games: '/api/games/live',
      game_details: '/api/games/:gameId',
      game_events: '/api/games/:gameId/events',
      teams: '/api/teams/:teamId',
      team_players: '/api/teams/:teamId/players',
      team_statistics: '/api/teams/:teamId/statistics',
      team_competitions: '/api/teams/:teamId/competitions',
      team_games: '/api/teams/:teamId/games',
      game_statistics: '/api/games/:gameId/statistics',
      league_table: '/api/leagues/:leagueId/table',
      rankings: '/api/leagues/rankings',
      logos: '/api/logos/team-:teamId/:size.:format',
      logo_info: '/api/logos/team-:teamId/info',
      logo_cache_stats: '/api/logos/cache/stats',
      health: '/health'
    },
    websocket: {
      available: true,
      endpoint: 'ws://localhost:3001',
      events: ['live_games_update', 'game_update']
    }
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Create HTTP server
const server = createServer(app);

// Initialize services
const websocketService = new WebSocketService(server);
const schedulerService = new SchedulerService();

// Connect services
schedulerService.setWebSocketService(websocketService);

// Setup graceful shutdown
setupGracefulShutdown(server, {
  schedulerService,
  websocketService
});

// Start server
const host = process.env.HOST || 'localhost';
server.listen(port, host, () => {
  console.log(`🚀 FloorLive Backend running on ${host}:${port}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🔗 API available at http://${host}:${port}/api`);
  console.log(`💖 Health check at http://localhost:${port}/health`);
  
  // Start scheduler after server is up
  schedulerService.start();
});

export default app;