import { Game } from '../types/domain.js';
import { CacheEntry, CacheStats } from '../types/services.js';

export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 60 * 60 * 1000; // 1 hour
  private readonly LIVE_GAME_TTL = 15 * 1000; // 15 seconds for live games (faster updates)
  private readonly FINISHED_GAME_TTL = 24 * 60 * 60 * 1000; // 24 hours for finished games

  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    };
    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Helper methods for games with smarter TTL
  setGames(date: string, games: Game[]): void {
    // Smart cache TTL based on game status distribution
    const hasLiveGames = games.some(game => game.status === 'live');
    const hasUpcomingGames = games.some(game => game.status === 'upcoming');
    const allFinished = games.length > 0 && games.every(game => game.status === 'finished');

    let ttl: number;
    if (hasLiveGames) {
      ttl = this.LIVE_GAME_TTL; // 15 seconds for live games
    } else if (allFinished) {
      ttl = this.FINISHED_GAME_TTL; // 24 hours for finished games
    } else if (hasUpcomingGames) {
      ttl = this.DEFAULT_TTL; // 1 hour for upcoming games
    } else {
      ttl = this.DEFAULT_TTL; // Default
    }

    this.set(`games:${date}`, games, ttl);
  }

  getGames(date: string): Game[] | null {
    return this.get(`games:${date}`);
  }

  // Force clear games cache for a specific date
  clearGamesCache(date: string): void {
    this.delete(`games:${date}`);
  }

  setLiveGames(games: Game[]): void {
    this.set('games:live', games, this.LIVE_GAME_TTL);
  }

  getLiveGames(): Game[] | null {
    return this.get('games:live');
  }

  // Get cache stats
  getStats() {
    let totalSize = 0;
    let expiredCount = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      totalSize++;
      if (now - entry.timestamp > entry.ttl) {
        expiredCount++;
      }
    }

    return {
      totalEntries: totalSize,
      expiredEntries: expiredCount,
      activeEntries: totalSize - expiredCount
    };
  }
}