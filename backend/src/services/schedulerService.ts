import cron from 'node-cron';
import { SwissUnihockeyApiClient } from './swissUnihockeyApi.js';
import { CacheService } from './cacheService.js';
import { WebSocketService } from './websocketService.js';
import { format, addDays, subDays } from 'date-fns';

export class SchedulerService {
  private apiClient: SwissUnihockeyApiClient;
  private cache: CacheService;
  private websocketService?: WebSocketService;
  private tasks: cron.ScheduledTask[] = [];

  constructor() {
    this.apiClient = new SwissUnihockeyApiClient();
    this.cache = new CacheService();
  }

  public setWebSocketService(websocketService: WebSocketService): void {
    this.websocketService = websocketService;
  }

  public start(): void {
    // 1. Refresh non-live games every hour at minute 0
    const hourlyRefreshTask = cron.schedule('0 * * * *', async () => {
      console.log('Running hourly games cache refresh...');
      await this.refreshGamesCache();
    }, {
      scheduled: false
    });

    // 2. Update live games every 30 seconds
    const liveGamesTask = cron.schedule('*/30 * * * * *', async () => {
      if (this.websocketService && this.websocketService.getConnectedClients() > 0) {
        console.log('Updating live games for WebSocket clients...');
        await this.updateLiveGames();
      }
    }, {
      scheduled: false
    });

    // 3. Cache cleanup every 15 minutes
    const cleanupTask = cron.schedule('*/15 * * * *', () => {
      console.log('Running cache cleanup...');
      this.cache.cleanup();
    }, {
      scheduled: false
    });

    // 4. Pre-cache tomorrow's games at midnight
    const midnightCacheTask = cron.schedule('0 0 * * *', async () => {
      console.log('Pre-caching tomorrow\'s games...');
      await this.preCacheTomorrowGames();
    }, {
      scheduled: false
    });

    // Store tasks for cleanup
    this.tasks = [hourlyRefreshTask, liveGamesTask, cleanupTask, midnightCacheTask];

    // Start all tasks
    this.tasks.forEach(task => task.start());

    // Run initial cache refresh
    this.refreshGamesCache();

    console.log('Scheduler service started with tasks:');
    console.log('- Hourly games refresh (0 * * * *)');
    console.log('- Live games update (*/30 * * * * *)');
    console.log('- Cache cleanup (*/15 * * * *)');
    console.log('- Midnight pre-cache (0 0 * * *)');
  }

  private async refreshGamesCache(): Promise<void> {
    try {
      const today = new Date();
      const yesterday = subDays(today, 1);
      const tomorrow = addDays(today, 1);
      
      const dates = [yesterday, today, tomorrow];

      for (const date of dates) {
        const dateString = format(date, 'yyyy-MM-dd');
        
        try {
          console.log(`Refreshing cache for ${dateString}...`);
          const games = await this.apiClient.getGamesByDate(dateString);
          
          // Only cache if we actually got data
          if (games && games.length >= 0) {
            this.cache.setGames(dateString, games);
            console.log(`Cached ${games.length} games for ${dateString}`);
          }
        } catch (error) {
          console.error(`Failed to refresh cache for ${dateString}:`, error);
        }
      }

      console.log('Hourly cache refresh completed');
    } catch (error) {
      console.error('Error in hourly cache refresh:', error);
    }
  }

  private async updateLiveGames(): Promise<void> {
    try {
      const liveGames = await this.apiClient.getCurrentGames();
      
      if (liveGames && liveGames.length > 0) {
        this.cache.setLiveGames(liveGames);
        console.log(`Updated cache with ${liveGames.length} live games`);
      }

      // Update specific live games for detailed view
      const liveGameIds = liveGames
        .filter(game => game.status === 'live')
        .map(game => game.id);

      if (this.websocketService && liveGameIds.length > 0) {
        for (const gameId of liveGameIds) {
          await this.websocketService.broadcastGameUpdate(gameId);
        }
      }

    } catch (error) {
      console.error('Error updating live games:', error);
    }
  }

  private async preCacheTomorrowGames(): Promise<void> {
    try {
      const tomorrow = addDays(new Date(), 1);
      const dateString = format(tomorrow, 'yyyy-MM-dd');
      
      console.log(`Pre-caching games for ${dateString}...`);
      const games = await this.apiClient.getGamesByDate(dateString);
      
      if (games) {
        this.cache.setGames(dateString, games);
        console.log(`Pre-cached ${games.length} games for ${dateString}`);
      }
    } catch (error) {
      console.error('Error pre-caching tomorrow\'s games:', error);
    }
  }

  public async manualRefresh(dateString: string): Promise<void> {
    try {
      console.log(`Manual refresh requested for ${dateString}`);
      const games = await this.apiClient.getGamesByDate(dateString);
      this.cache.setGames(dateString, games);
      console.log(`Manually cached ${games.length} games for ${dateString}`);
    } catch (error) {
      console.error(`Error in manual refresh for ${dateString}:`, error);
      throw error;
    }
  }

  public getCacheStats() {
    return this.cache.getStats();
  }

  public stop(): void {
    console.log('Stopping scheduler service...');
    this.tasks.forEach(task => {
      if (task) {
        task.destroy();
      }
    });
    this.tasks = [];
    console.log('Scheduler service stopped');
  }
}