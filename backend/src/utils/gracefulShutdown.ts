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
  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down gracefully...`);
    
    // Stop services in order
    if (services.schedulerService) {
      services.schedulerService.stop();
    }
    
    if (services.websocketService) {
      services.websocketService.cleanup();
    }
    
    // Close server
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}