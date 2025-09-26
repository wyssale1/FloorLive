/**
 * Shared utilities for image configuration
 * Used by both frontend and backend for consistent image handling
 */
/**
 * Core image configuration utilities
 */
export class ImageConfigUtils {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Generate a single image URL
     */
    generateImageUrl(options) {
        const { entityType, entityId, size, format, retinaScale = 1 } = options;
        const entityConfig = this.config.entities[entityType];
        if (!entityConfig) {
            throw new Error(`Unknown entity type: ${entityType}`);
        }
        const sizeConfig = entityConfig.sizes[size];
        if (!sizeConfig) {
            throw new Error(`Unknown size for ${entityType}: ${size}`);
        }
        // Check if retina scale is supported for this size
        if (!sizeConfig.retinaScales.includes(retinaScale)) {
            throw new Error(`Retina scale ${retinaScale}x not supported for ${entityType} ${size}`);
        }
        const retinaSuffix = this.config.retina.suffixes[retinaScale.toString()];
        const directory = entityConfig.directoryNaming.replace('{id}', entityId);
        let filename = entityConfig.fileNaming
            .replace('{id}', entityId)
            .replace('{size}', sizeConfig.suffix || size)
            .replace('{retina}', retinaSuffix)
            .replace('{format}', format);
        return `${entityConfig.basePath}/${directory}/${filename}`;
    }
    /**
     * Generate responsive image URLs for all available retina scales
     */
    generateResponsiveUrls(entityType, entityId, size, format) {
        const entityConfig = this.config.entities[entityType];
        const sizeConfig = entityConfig?.sizes[size];
        if (!sizeConfig) {
            throw new Error(`Unknown size for ${entityType}: ${size}`);
        }
        const urls = {};
        for (const scale of sizeConfig.retinaScales) {
            const scaleKey = `${scale}x`;
            urls[scaleKey] = this.generateImageUrl({
                entityType,
                entityId,
                size,
                format,
                retinaScale: scale
            });
        }
        return urls;
    }
    /**
     * Get CSS classes for components
     */
    getCssClasses(options) {
        const { entityType, size, type } = options;
        const entityConfig = this.config.entities[entityType];
        const sizeConfig = entityConfig?.sizes[size];
        if (!sizeConfig) {
            throw new Error(`Unknown size for ${entityType}: ${size}`);
        }
        switch (type) {
            case 'main':
                return sizeConfig.css;
            case 'iconFallback':
                return sizeConfig.iconFallbackCss || '';
            case 'badge':
                return sizeConfig.badgeCss || '';
            case 'container':
                return sizeConfig.containerCss || '';
            case 'logo':
                return sizeConfig.logoCss || '';
            default:
                throw new Error(`Unknown CSS type: ${type}`);
        }
    }
    /**
     * Get all available sizes for an entity type
     */
    getAvailableSizes(entityType) {
        const entityConfig = this.config.entities[entityType];
        return Object.keys(entityConfig?.sizes || {});
    }
    /**
     * Get all available formats in preference order
     */
    getAvailableFormats() {
        return this.config.formats.order;
    }
    /**
     * Get size configuration for an entity
     */
    getSizeConfig(entityType, size) {
        return this.config.entities[entityType]?.sizes[size];
    }
    /**
     * Get processing configuration
     */
    getProcessingConfig() {
        return this.config.processing;
    }
    /**
     * Get API configuration
     */
    getApiConfig() {
        return this.config.api;
    }
    /**
     * Generate directory path for an entity
     */
    generateDirectoryPath(entityType, entityId) {
        const entityConfig = this.config.entities[entityType];
        const directory = entityConfig.directoryNaming.replace('{id}', entityId);
        return `${entityConfig.basePath}/${directory}`;
    }
    /**
     * Generate all possible image URLs for an entity (all sizes, formats, retina scales)
     */
    generateAllImageUrls(entityType, entityId) {
        const sizes = this.getAvailableSizes(entityType);
        const formats = this.getAvailableFormats();
        const result = {};
        for (const size of sizes) {
            result[size] = {};
            for (const format of formats) {
                result[size][format] = this.generateResponsiveUrls(entityType, entityId, size, format);
            }
        }
        return result;
    }
    /**
     * Create image metadata for API responses
     */
    createImageMetadata(entityType, entityId, hasImage) {
        if (!hasImage) {
            return {
                hasImage: false,
                formats: this.getAvailableFormats(),
                sizes: this.getAvailableSizes(entityType)
            };
        }
        const sizes = this.getAvailableSizes(entityType);
        const preferredFormat = this.getAvailableFormats()[1] || 'webp'; // Use webp as default
        const urls = {};
        for (const size of sizes) {
            urls[size] = this.generateResponsiveUrls(entityType, entityId, size, preferredFormat);
        }
        return {
            hasImage: true,
            urls: urls,
            formats: this.getAvailableFormats(),
            sizes
        };
    }
    /**
     * Validate configuration
     */
    validateConfig() {
        try {
            // Check required top-level properties
            if (!this.config.version || !this.config.formats || !this.config.entities) {
                return false;
            }
            // Check formats
            if (!Array.isArray(this.config.formats.order) || this.config.formats.order.length === 0) {
                return false;
            }
            // Check entities
            for (const [, entityConfig] of Object.entries(this.config.entities)) {
                if (!entityConfig.basePath || !entityConfig.directoryNaming || !entityConfig.fileNaming) {
                    return false;
                }
                if (!entityConfig.sizes || Object.keys(entityConfig.sizes).length === 0) {
                    return false;
                }
                // Check each size configuration
                for (const [, sizeConfig] of Object.entries(entityConfig.sizes)) {
                    if (!sizeConfig.width || !sizeConfig.height || !sizeConfig.css) {
                        return false;
                    }
                    if (!Array.isArray(sizeConfig.retinaScales) || sizeConfig.retinaScales.length === 0) {
                        return false;
                    }
                }
            }
            return true;
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=imageConfigUtils.js.map