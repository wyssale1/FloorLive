import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getImageUtils } from '../utils/imageConfigLoader.js';
import type { EntityType, ImageSize } from '../shared/types/imageConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AssetService {
  private readonly ASSETS_DIR = path.join(__dirname, '..', '..', 'assets');

  /**
   * Check if an entity asset exists
   */
  private async hasEntityAsset(entityType: EntityType, entityId: string, size: ImageSize = 'small'): Promise<boolean> {
    try {
      const utils = await getImageUtils();
      const url = utils.generateImageUrl({
        entityType,
        entityId,
        size,
        format: 'webp' // Check for webp as default
      });

      // Convert URL to file system path
      const assetPath = path.join(this.ASSETS_DIR, url.replace('/assets/', ''));
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
   * Generate URLs for an entity using centralized configuration
   */
  private async generateEntityUrls(entityType: EntityType, entityId: string): Promise<Record<string, Record<string, string>>> {
    const utils = await getImageUtils();
    const sizes = utils.getAvailableSizes(entityType);
    const formats = utils.getAvailableFormats();
    const result: Record<string, Record<string, string>> = {};

    // Add development prefix if needed
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const urlPrefix = isDevelopment ? 'http://localhost:3001' : '';

    for (const size of sizes) {
      result[size] = {};
      for (const format of formats) {
        const url = utils.generateImageUrl({
          entityType,
          entityId,
          size,
          format
        });
        result[size][format] = `${urlPrefix}${url}`;
      }
    }

    return result;
  }

  /**
   * Get team logo URLs (build-time processed assets)
   */
  async getTeamLogoUrls(teamId: string): Promise<{
    large: Record<string, string>;
    small: Record<string, string>;
  }> {
    const urls = await this.generateEntityUrls('teams', teamId);
    return {
      large: urls.large || {},
      small: urls.small || {}
    };
  }

  /**
   * Get player image URLs (build-time processed assets)
   */
  async getPlayerImageUrls(playerId: string): Promise<Record<string, Record<string, string>>> {
    return this.generateEntityUrls('players', playerId);
  }

  /**
   * Create image metadata for API responses
   */
  async createImageMetadata(entityType: EntityType, entityId: string): Promise<any> {
    const utils = await getImageUtils();
    const hasImage = await this.hasEntityAsset(entityType, entityId);
    return utils.createImageMetadata(entityType, entityId, hasImage);
  }
}

export const assetService = new AssetService();