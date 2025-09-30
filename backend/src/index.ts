import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import gamesRouter from './routes/games.js';
import teamsRouter from './routes/teams.js';
import leaguesRouter from './routes/leagues.js';
import playersRouter from './routes/players.js';
import searchRouter from './routes/search.js';
import sitemapRouter from './routes/sitemap.js';
import debugRouter from './routes/debug.js';
import { WebSocketService } from './services/websocketService.js';
import { SchedulerService } from './services/schedulerService.js';
import { setupGracefulShutdown } from './utils/gracefulShutdown.js';
import { SEOService } from './services/seoService.js';
import { logger } from './utils/logger.js';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: process.env.NODE_ENV === 'production' 
    ? { policy: "same-origin" }
    : { policy: "cross-origin" }
}));
// CORS configuration - allow Tailscale access when HOST=0.0.0.0
const corsOrigin = () => {
  if (process.env.NODE_ENV === 'production') {
    return ['https://floorlive.ch', 'http://floorlive.ch'];
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

// Morgan logging: environment-based verbosity
if (process.env.NODE_ENV === 'production') {
  // Production: minimal logging (or disable completely)
  app.use(morgan('tiny'));
} else {
  // Development: more verbose
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SEO middleware for bots (before routes)
app.use(SEOService.middleware());

// Routes
app.use('/api/games', gamesRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/leagues', leaguesRouter);
app.use('/api/players', playersRouter);
app.use('/api/search', searchRouter);
app.use('/api/debug', debugRouter);

// SEO routes (no /api prefix for sitemap.xml)
app.use('/', sitemapRouter);

// Static assets serving - use absolute path to ensure it works regardless of working directory
const playersAssetsPath = path.join(__dirname, '..', 'assets', 'players');
const teamsAssetsPath = path.join(__dirname, '..', 'assets', 'teams');
const assetsOptions = {
  maxAge: '7d', // Cache for 7 days
  etag: true,
  lastModified: true
};

// Serve player and team assets FIRST - this allows natural 404s for missing files
app.use('/assets/players', express.static(playersAssetsPath, assetsOptions));
app.use('/assets/teams', express.static(teamsAssetsPath, assetsOptions));
app.use('/api/assets/players', express.static(playersAssetsPath, assetsOptions));
app.use('/api/assets/teams', express.static(teamsAssetsPath, assetsOptions));

// Simplified asset serving - let frontend handle missing images gracefully

// Asset-specific 404 handler - prevents downloads of non-existent assets
app.use('/assets/', (req, res, next) => {
  // If we reach this point, the asset doesn't exist
  // Close the connection without sending any response
  res.destroy();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Debug endpoint for assets path (remove in production)
app.get('/debug/assets-path', (req, res) => {
  const playersPath = path.join(__dirname, '..', 'assets', 'players');
  const teamsPath = path.join(__dirname, '..', 'assets', 'teams');
  res.json({
    playersAssetsPath: playersPath,
    teamsAssetsPath: teamsPath,
    playersExists: fs.existsSync(playersPath),
    teamsExists: fs.existsSync(teamsPath),
    workingDirectory: process.cwd(),
    __dirname
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
      search: '/api/search?q=query',
      search_teams: '/api/teams/search?q=query',
      search_players: '/api/players/search?q=query',
      game_statistics: '/api/games/:gameId/statistics',
      league_table: '/api/leagues/:leagueId/table',
      rankings: '/api/leagues/rankings',
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
  logger.error('Unhandled error:', err);
  
  // Enhanced error response
  const status = (err as any).status || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.name || 'Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    status,
    timestamp: new Date().toISOString(),
    path: `${req.method} ${req.path}`,
    details: process.env.NODE_ENV === 'development' ? {
      stack: err.stack,
      body: req.body,
      query: req.query,
      params: req.params
    } : undefined
  });
});

// 404 handler
app.use((req, res) => {
  // For asset paths, return empty 404 to trigger reliable img.onError events
  if (req.path.startsWith('/assets/')) {
    return res.status(404).end();
  }

  // For API routes, return structured JSON error
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    status: 404,
    timestamp: new Date().toISOString(),
    path: `${req.method} ${req.path}`
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
  logger.info(`🚀 FloorLive Backend running on ${host}:${port}`);
  logger.info(`📡 WebSocket server ready`);
  logger.info(`🔗 API available at http://${host}:${port}/api`);
  logger.info(`💖 Health check at http://localhost:${port}/health`);
  logger.info(`📊 Log level: ${process.env.LOG_LEVEL || 'INFO'}`);

  // Start scheduler after server is up
  schedulerService.start();
});

export default app;