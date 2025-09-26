/**
 * Frontend Image Utilities
 *
 * Self-contained image utilities for the frontend.
 * Handles responsive images, fallbacks, and optimization without external dependencies.
 */

import type {
  ImageConfig, ImageFormatType, ImageSize, ResponsiveImageUrls,
  EntityType, CssClassOptions, FormatSupport
} from '../types/images';
import {
  DEFAULT_IMAGE_CONFIG, DEFAULT_SIZE_CONFIGS
} from '../types/images';

class ImageUtils {
  private config: ImageConfig;
  private formatSupport: FormatSupport | null = null;

  constructor(config?: Partial<ImageConfig>) {
    // Merge with defaults
    this.config = {
      version: '1.0.0',
      ...DEFAULT_IMAGE_CONFIG,
      ...config
    } as ImageConfig;
  }

  /**
   * Detect browser format support
   */
  private detectFormatSupport(): FormatSupport {
    if (this.formatSupport) return this.formatSupport;

    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;

    this.formatSupport = {
      avif: canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0,
      webp: canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0,
      png: true // Always supported
    };

    return this.formatSupport;
  }

  /**
   * Get the best supported format based on browser capabilities
   */
  getBestFormat(preferredFormats?: ImageFormatType[]): ImageFormatType {
    const support = this.detectFormatSupport();
    const formats = preferredFormats || this.config.formats?.order || ['avif', 'webp', 'png'];

    for (const format of formats) {
      if (support[format as keyof FormatSupport]) {
        return format as ImageFormatType;
      }
    }

    return 'png'; // Fallback
  }

  /**
   * Generate responsive URLs for an entity
   */
  generateResponsiveUrls(
    entityType: EntityType,
    entityId: string,
    size: ImageSize,
    format: ImageFormatType
  ): ResponsiveImageUrls {
    const entityConfig = this.config.entities?.[entityType];
    if (!entityConfig) {
      return { '1x': this.getFallbackUrl(entityType, size) };
    }

    const sizeConfig = entityConfig.sizes[size];
    if (!sizeConfig) {
      return { '1x': this.getFallbackUrl(entityType, size) };
    }

    const baseUrl = `/assets/images/${entityType}/${entityId}`;
    const extension = this.config.formats?.extensions[format] || '.png';
    const urls: ResponsiveImageUrls = { '1x': '' };

    // Generate URLs for each retina scale
    sizeConfig.retinaScales.forEach(scale => {
      const suffix = this.config.retina?.suffixes[scale.toString()] || '';
      urls[`${scale}x` as keyof ResponsiveImageUrls] =
        `${baseUrl}/${size}${suffix}${extension}`;
    });

    return urls;
  }

  /**
   * Generate srcSet string for responsive images
   */
  generateSrcSet(
    entityType: EntityType,
    entityId: string,
    size: ImageSize,
    format: ImageFormatType
  ): string {
    const urls = this.generateResponsiveUrls(entityType, entityId, size, format);
    const srcSetParts: string[] = [];

    Object.entries(urls).forEach(([density, url]) => {
      if (url) {
        srcSetParts.push(`${url} ${density}`);
      }
    });

    return srcSetParts.join(', ');
  }

  /**
   * Get optimal URL for current device pixel ratio
   */
  getOptimalUrl(
    entityType: EntityType,
    entityId: string,
    size: ImageSize,
    format?: ImageFormatType,
    devicePixelRatio?: number
  ): string {
    const selectedFormat = format || this.getBestFormat();
    const urls = this.generateResponsiveUrls(entityType, entityId, size, selectedFormat);
    const dpr = devicePixelRatio || window.devicePixelRatio || 1;

    if (dpr >= 3 && urls['3x']) {
      return urls['3x'];
    } else if (dpr >= 2 && urls['2x']) {
      return urls['2x'];
    }

    return urls['1x'];
  }

  /**
   * Get fallback URL when image is not available
   */
  getFallbackUrl(entityType: EntityType, size: ImageSize): string {
    const sizeConfig = DEFAULT_SIZE_CONFIGS[size];

    // Return a data URL or placeholder based on entity type
    if (entityType === 'players') {
      return `data:image/svg+xml,${encodeURIComponent(`
        <svg width="${sizeConfig.width}" height="${sizeConfig.height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#e5e7eb"/>
          <text x="50%" y="50%" font-family="Arial" font-size="12" text-anchor="middle" dy="0.3em" fill="#9ca3af">
            Player
          </text>
        </svg>
      `)}`;
    }

    if (entityType === 'teams') {
      return `data:image/svg+xml,${encodeURIComponent(`
        <svg width="${sizeConfig.width}" height="${sizeConfig.height}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#e5e7eb"/>
          <text x="50%" y="50%" font-family="Arial" font-size="12" text-anchor="middle" dy="0.3em" fill="#9ca3af">
            Team
          </text>
        </svg>
      `)}`;
    }

    return '';
  }

  /**
   * Get CSS classes for image containers
   */
  getCssClasses(options: CssClassOptions): string {
    const sizeConfig = DEFAULT_SIZE_CONFIGS[options.size];
    return sizeConfig.css;
  }

  /**
   * Check if an image URL exists (client-side check)
   */
  async checkImageExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Preload an image
   */
  preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Get image dimensions
   */
  getImageDimensions(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Create a placeholder data URL
   */
  createPlaceholder(width: number, height: number, text?: string): string {
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        ${text ? `<text x="50%" y="50%" font-family="Arial" font-size="14" text-anchor="middle" dy="0.3em" fill="#6b7280">${text}</text>` : ''}
      </svg>
    `)}`;
  }

  /**
   * Get available formats
   */
  getAvailableFormats(): ImageFormatType[] {
    return (this.config.formats?.order || ['avif', 'webp', 'png']) as ImageFormatType[];
  }

  /**
   * Validate configuration
   */
  validateConfig(): boolean {
    try {
      if (!this.config.version) return false;
      if (!this.config.formats?.order || this.config.formats.order.length === 0) return false;
      if (!this.config.entities) return false;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ImageConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.formatSupport = null; // Reset format support detection
  }

  /**
   * Get current configuration
   */
  getConfig(): ImageConfig {
    return { ...this.config };
  }
}

// Create and export singleton instance
export const imageUtils = new ImageUtils();

// Convenience functions
export const getBestFormat = (formats?: ImageFormatType[]) => imageUtils.getBestFormat(formats);
export const generateResponsiveUrls = (entityType: EntityType, entityId: string, size: ImageSize, format: ImageFormatType) =>
  imageUtils.generateResponsiveUrls(entityType, entityId, size, format);
export const generateSrcSet = (entityType: EntityType, entityId: string, size: ImageSize, format: ImageFormatType) =>
  imageUtils.generateSrcSet(entityType, entityId, size, format);
export const getOptimalUrl = (entityType: EntityType, entityId: string, size: ImageSize, format?: ImageFormatType) =>
  imageUtils.getOptimalUrl(entityType, entityId, size, format);
export const getFallbackUrl = (entityType: EntityType, size: ImageSize) =>
  imageUtils.getFallbackUrl(entityType, size);
export const getCssClasses = (options: CssClassOptions) => imageUtils.getCssClasses(options);

// Export the class for advanced usage
export { ImageUtils };

// Default instance
export default imageUtils;