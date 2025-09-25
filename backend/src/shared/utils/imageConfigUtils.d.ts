/**
 * Shared utilities for image configuration
 * Used by both frontend and backend for consistent image handling
 */
import type { ImageConfig, EntityType, ImageSize, ImageFormatType, ImageUrlOptions, CssClassOptions, ResponsiveImageUrls, ImageMetadata } from '../types/imageConfig.js';
/**
 * Core image configuration utilities
 */
export declare class ImageConfigUtils {
    private config;
    constructor(config: ImageConfig);
    /**
     * Generate a single image URL
     */
    generateImageUrl(options: ImageUrlOptions): string;
    /**
     * Generate responsive image URLs for all available retina scales
     */
    generateResponsiveUrls(entityType: EntityType, entityId: string, size: ImageSize, format: ImageFormatType): ResponsiveImageUrls;
    /**
     * Get CSS classes for components
     */
    getCssClasses(options: CssClassOptions): string;
    /**
     * Get all available sizes for an entity type
     */
    getAvailableSizes(entityType: EntityType): ImageSize[];
    /**
     * Get all available formats in preference order
     */
    getAvailableFormats(): ImageFormatType[];
    /**
     * Get size configuration for an entity
     */
    getSizeConfig(entityType: EntityType, size: ImageSize): import("../types/imageConfig.js").SizeConfig;
    /**
     * Get processing configuration
     */
    getProcessingConfig(): import("../types/imageConfig.js").ProcessingConfig;
    /**
     * Get API configuration
     */
    getApiConfig(): import("../types/imageConfig.js").ApiConfig;
    /**
     * Generate directory path for an entity
     */
    generateDirectoryPath(entityType: EntityType, entityId: string): string;
    /**
     * Generate all possible image URLs for an entity (all sizes, formats, retina scales)
     */
    generateAllImageUrls(entityType: EntityType, entityId: string): Record<string, Record<string, ResponsiveImageUrls>>;
    /**
     * Create image metadata for API responses
     */
    createImageMetadata(entityType: EntityType, entityId: string, hasImage: boolean): ImageMetadata;
    /**
     * Validate configuration
     */
    validateConfig(): boolean;
}
//# sourceMappingURL=imageConfigUtils.d.ts.map