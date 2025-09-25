/**
 * Backend image configuration loader
 * Loads and provides access to the centralized image configuration
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ImageConfig } from '../shared/types/imageConfig.js';
import { ImageConfigUtils } from '../shared/utils/imageConfigUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ImageConfigLoader {
  private config: ImageConfig | null = null;
  private utils: ImageConfigUtils | null = null;
  private configPath: string;

  constructor() {
    // Path to shared config file
    this.configPath = path.join(__dirname, '..', 'shared/imageConfig.json');
  }

  /**
   * Load configuration from file
   */
  async loadConfig(): Promise<ImageConfig> {
    if (this.config) {
      return this.config;
    }

    try {
      if (!await fs.pathExists(this.configPath)) {
        throw new Error(`Image configuration file not found: ${this.configPath}`);
      }

      this.config = await fs.readJson(this.configPath);

      if (!this.config) {
        throw new Error('Failed to parse image configuration');
      }

      // Create utils instance
      this.utils = new ImageConfigUtils(this.config);

      // Validate configuration
      if (!this.utils.validateConfig()) {
        throw new Error('Invalid image configuration');
      }

      console.log(`✅ Loaded image configuration v${this.config.version}`);
      return this.config;

    } catch (error) {
      console.error('❌ Failed to load image configuration:', error);
      throw error;
    }
  }

  /**
   * Get configuration (loads if needed)
   */
  async getConfig(): Promise<ImageConfig> {
    if (!this.config) {
      await this.loadConfig();
    }
    return this.config!;
  }

  /**
   * Get utils instance (loads config if needed)
   */
  async getUtils(): Promise<ImageConfigUtils> {
    if (!this.utils) {
      await this.loadConfig();
    }
    return this.utils!;
  }

  /**
   * Reload configuration from file
   */
  async reloadConfig(): Promise<ImageConfig> {
    this.config = null;
    this.utils = null;
    return await this.loadConfig();
  }

  /**
   * Check if configuration is loaded
   */
  isLoaded(): boolean {
    return this.config !== null && this.utils !== null;
  }
}

// Create singleton instance
export const imageConfigLoader = new ImageConfigLoader();

// Convenience exports
export const getImageConfig = () => imageConfigLoader.getConfig();
export const getImageUtils = () => imageConfigLoader.getUtils();