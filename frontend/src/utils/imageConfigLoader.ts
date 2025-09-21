/**
 * Frontend image configuration loader
 * Loads and provides access to the centralized image configuration
 */

import type { ImageConfig } from '../../../shared/types/imageConfig';
import { ImageConfigUtils } from '../../../shared/utils/imageConfigUtils';

// Import the configuration directly (bundled at build time)
import imageConfigData from '../../../shared/imageConfig.json';

class ImageConfigLoader {
  private config: ImageConfig;
  private utils: ImageConfigUtils;

  constructor() {
    // Type assertion since we know the structure is correct
    this.config = imageConfigData as ImageConfig;
    this.utils = new ImageConfigUtils(this.config);

    // Validate configuration in development
    if (import.meta.env.DEV && !this.utils.validateConfig()) {
      console.error('❌ Invalid image configuration detected');
      throw new Error('Invalid image configuration');
    }

    if (import.meta.env.DEV) {
      console.log(`✅ Loaded image configuration v${this.config.version}`);
    }
  }

  /**
   * Get configuration
   */
  getConfig(): ImageConfig {
    return this.config;
  }

  /**
   * Get utils instance
   */
  getUtils(): ImageConfigUtils {
    return this.utils;
  }

  /**
   * Check if configuration is valid
   */
  isValid(): boolean {
    return this.utils.validateConfig();
  }
}

// Create singleton instance
export const imageConfigLoader = new ImageConfigLoader();

// Convenience exports
export const getImageConfig = () => imageConfigLoader.getConfig();
export const getImageUtils = () => imageConfigLoader.getUtils();

// Hook for React components
export const useImageConfig = () => {
  return {
    config: imageConfigLoader.getConfig(),
    utils: imageConfigLoader.getUtils()
  };
};