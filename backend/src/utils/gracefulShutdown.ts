import { Server } from 'http';

interface ShutdownServices {
  schedulerService?: {
    stop(): void;
  };
  websocketService?: {
    cleanup(): void;
  };
}

export function setupGracefulShutdown(server: Server, services: ShutdownServices = {}) {
  const shutdown = async (signal: string) => {
    console.log(`${signal} received, shutting down gracefully...`);
    
    try {
      // Stop services in order
      if (services.schedulerService) {
        console.log('Stopping scheduler service...');
        services.schedulerService.stop();
      }
      
      
      if (services.websocketService) {
        console.log('Cleaning up websocket service...');
        services.websocketService.cleanup();
      }
      
      // Close server
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}