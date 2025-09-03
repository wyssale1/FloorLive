import { Game } from '../types/api.js';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 60 * 60 * 1000; // 1 hour
  private readonly LIVE_GAME_TTL = 30 * 1000; // 30 seconds for live games

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

  // Helper methods for games
  setGames(date: string, games: Game[]): void {
    const hasLiveGames = games.some(game => game.status === 'live');
    const ttl = hasLiveGames ? this.LIVE_GAME_TTL : this.DEFAULT_TTL;
    this.set(`games:${date}`, games, ttl);
  }

  getGames(date: string): Game[] | null {
    return this.get(`games:${date}`);
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