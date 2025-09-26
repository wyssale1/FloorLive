/**
 * Frontend image configuration loader
 * Self-contained image configuration system for the frontend
 */

import type { ImageConfig } from '../types/images';
import { imageUtils } from './imageUtils';

class ImageConfigLoader {
  constructor() {
    // Validate configuration in development
    if (import.meta.env.DEV && !imageUtils.validateConfig()) {
      console.error('❌ Invalid image configuration detected');
    } else if (import.meta.env.DEV) {
      console.log(`✅ Loaded image configuration v${imageUtils.getConfig().version}`);
    }
  }

  /**
   * Get configuration
   */
  getConfig(): ImageConfig {
    return imageUtils.getConfig();
  }

  /**
   * Get utils instance
   */
  getUtils() {
    return imageUtils;
  }

  /**
   * Check if configuration is valid
   */
  isValid(): boolean {
    return imageUtils.validateConfig();
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