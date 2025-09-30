import * as cron from 'node-cron';
import { SwissUnihockeyApiClient } from './swissUnihockeyApi.js';
import { CacheService } from './cacheService.js';
import { WebSocketService } from './websocketService.js';
import { format, addDays, subDays } from 'date-fns';
import { logger } from '../utils/logger.js';

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
      logger.info('Running hourly games cache refresh...');
      await this.refreshGamesCache();
    });

    // 2. Update live games every 30 seconds
    const liveGamesTask = cron.schedule('*/30 * * * * *', async () => {
      if (this.websocketService && this.websocketService.getConnectedClients() > 0) {
        logger.debug('Updating live games for WebSocket clients...');
        await this.updateLiveGames();
      }
    });

    // 3. Cache cleanup every 15 minutes
    const cleanupTask = cron.schedule('*/15 * * * *', () => {
      logger.debug('Running cache cleanup...');
      this.cache.cleanup();
    });

    // 4. Pre-cache tomorrow's games at midnight
    const midnightCacheTask = cron.schedule('0 0 * * *', async () => {
      logger.info('Pre-caching tomorrow\'s games...');
      await this.preCacheTomorrowGames();
    });

    // Store tasks for cleanup
    this.tasks = [hourlyRefreshTask, liveGamesTask, cleanupTask, midnightCacheTask];

    // Start all tasks
    this.tasks.forEach(task => task.start());

    // Run initial cache refresh
    this.refreshGamesCache();

    logger.info('Scheduler service started with tasks:');
    logger.info('- Hourly games refresh (0 * * * *)');
    logger.info('- Live games update (*/30 * * * * *)');
    logger.info('- Cache cleanup (*/15 * * * *)');
    logger.info('- Midnight pre-cache (0 0 * * *)');
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
          logger.debug(`Refreshing cache for ${dateString}...`);
          const games = await this.apiClient.getGamesByDate(dateString);

          // Only cache if we actually got data
          if (games && games.length >= 0) {
            this.cache.setGames(dateString, games);
            logger.debug(`Cached ${games.length} games for ${dateString}`);
          }
        } catch (error) {
          logger.error(`Failed to refresh cache for ${dateString}:`, error);
        }
      }

      logger.info('Hourly cache refresh completed');
    } catch (error) {
      logger.error('Error in hourly cache refresh:', error);
    }
  }

  private async updateLiveGames(): Promise<void> {
    try {
      const liveGames = await this.apiClient.getCurrentGames();

      if (liveGames && liveGames.length > 0) {
        this.cache.setLiveGames(liveGames);
        logger.debug(`Updated cache with ${liveGames.length} live games`);
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
      logger.error('Error updating live games:', error);
    }
  }

  private async preCacheTomorrowGames(): Promise<void> {
    try {
      const tomorrow = addDays(new Date(), 1);
      const dateString = format(tomorrow, 'yyyy-MM-dd');

      logger.info(`Pre-caching games for ${dateString}...`);
      const games = await this.apiClient.getGamesByDate(dateString);

      if (games) {
        this.cache.setGames(dateString, games);
        logger.info(`Pre-cached ${games.length} games for ${dateString}`);
      }
    } catch (error) {
      logger.error('Error pre-caching tomorrow\'s games:', error);
    }
  }

  public async manualRefresh(dateString: string): Promise<void> {
    try {
      logger.info(`Manual refresh requested for ${dateString}`);
      const games = await this.apiClient.getGamesByDate(dateString);
      this.cache.setGames(dateString, games);
      logger.info(`Manually cached ${games.length} games for ${dateString}`);
    } catch (error) {
      logger.error(`Error in manual refresh for ${dateString}:`, error);
      throw error;
    }
  }

  public getCacheStats() {
    return this.cache.getStats();
  }

  public stop(): void {
    logger.info('Stopping scheduler service...');
    this.tasks.forEach(task => {
      if (task) {
        task.destroy();
      }
    });
    this.tasks = [];
    logger.info('Scheduler service stopped');
  }
}