import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AssetService {
  private readonly ASSETS_DIR = path.join(__dirname, '..', '..', 'assets');
  private assetDirectoryCache = new Map<string, { exists: boolean; timestamp: number }>();
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds
  private readonly FORMATS = ['avif', 'webp', 'png'] as const;
  private readonly SIZES = ['large', 'small'] as const;

  /**
   * Check if an entity asset exists (simplified version)
   */
  private async hasEntityAsset(entityType: string, entityId: string, size: string = 'small'): Promise<boolean> {
    try {
      // Simple path construction like old working version
      const assetPath = path.join(this.ASSETS_DIR, entityType, `${entityType.slice(0, -1)}-${entityId}`, `${size}.webp`);
      await fs.access(assetPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a team logo exists
   */
  async hasTeamLogo(teamId: string): Promise<boolean> {
    return this.hasEntityAsset('teams', teamId, 'small');
  }

  /**
   * Check if a player image exists
   */
  async hasPlayerImage(playerId: string): Promise<boolean> {
    return this.hasEntityAsset('players', playerId, 'small');
  }

  /**
   * Check if a player directory exists (optimized for performance)
   * Uses simple directory check with caching
   */
  hasPlayerDirectory(playerId: string): boolean {
    const cacheKey = `player-${playerId}`;
    const cached = this.assetDirectoryCache.get(cacheKey);
    const now = Date.now();

    // Return cached result if still valid
    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      return cached.exists;
    }

    // Check directory existence
    const playerDir = path.join(this.ASSETS_DIR, 'players', `player-${playerId}`);
    let exists: boolean;

    try {
      // Use synchronous check for better performance
      const stats = fsSync.statSync(playerDir);
      exists = stats.isDirectory();
    } catch {
      exists = false;
    }

    // Cache the result
    this.assetDirectoryCache.set(cacheKey, { exists, timestamp: now });

    return exists;
  }

  /**
   * Generate URLs for an entity (simplified version)
   */
  private generateEntityUrls(entityType: string, entityId: string): Record<string, Record<string, string>> {
    const result: Record<string, Record<string, string>> = {};

    // Add development prefix if needed
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const urlPrefix = isDevelopment ? 'http://localhost:3001' : '';

    for (const size of this.SIZES) {
      result[size] = {};
      for (const format of this.FORMATS) {
        // Simple URL generation like old working version
        const url = `/assets/${entityType}/${entityType.slice(0, -1)}-${entityId}/${size}.${format}`;
        result[size][format] = `${urlPrefix}${url}`;
      }
    }

    return result;
  }

  /**
   * Get team logo URLs (build-time processed assets)
   */
  getTeamLogoUrls(teamId: string): {
    large: Record<string, string>;
    small: Record<string, string>;
  } {
    const urls = this.generateEntityUrls('teams', teamId);
    return {
      large: urls.large || {},
      small: urls.small || {}
    };
  }

  /**
   * Get player image URLs (build-time processed assets)
   */
  getPlayerImageUrls(playerId: string): Record<string, Record<string, string>> {
    return this.generateEntityUrls('players', playerId);
  }

  /**
   * Create image metadata for API responses (simplified)
   */
  async createImageMetadata(entityType: string, entityId: string): Promise<any> {
    const hasImage = await this.hasEntityAsset(entityType, entityId);

    // Simple metadata creation like old working version
    if (!hasImage) {
      return {
        hasImage: false,
        urls: null
      };
    }

    return {
      hasImage: true,
      urls: this.generateEntityUrls(entityType, entityId)
    };
  }
}

export const assetService = new AssetService();