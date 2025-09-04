import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import gamesRouter from './routes/games.js';
import { WebSocketService } from './services/websocketService.js';
import { SchedulerService } from './services/schedulerService.js';
import { setupGracefulShutdown } from './utils/gracefulShutdown.js';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  //origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  origin: '*',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/games', gamesRouter);

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
server.listen(port, () => {
  console.log(`🚀 FloorLive Backend running on port ${port}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🔗 API available at http://localhost:${port}/api`);
  console.log(`💖 Health check at http://localhost:${port}/health`);
  
  // Start scheduler after server is up
  schedulerService.start();
});

export default app;