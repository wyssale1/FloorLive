/**
 * Frontend Image System Types
 *
 * Self-contained image configuration and responsive image types.
 * No dependencies on root shared folder - frontend owns its image system.
 */

// Image Format Types
export type ImageFormatType = 'avif' | 'webp' | 'png';
export type ImageSize = 'tiny' | 'small' | 'medium' | 'large';
export type RetinaScale = 1 | 2 | 3;
export type EntityType = 'players' | 'teams';

// Responsive Image URLs
export interface ResponsiveImageUrls {
  '1x': string;
  '2x'?: string;
  '3x'?: string;
}

// Image Metadata for Components
export interface ImageMetadata {
  hasImage: boolean;
  urls?: {
    small?: ResponsiveImageUrls;
    medium?: ResponsiveImageUrls;
    large?: ResponsiveImageUrls;
  };
  formats: ImageFormatType[];
  sizes: ImageSize[];
}

// Size Configuration
export interface SizeConfig {
  width: number;
  height: number;
  css: string;
  suffix?: string;
  retinaScales: number[];
  iconFallbackCss?: string;
  badgeCss?: string;
  containerCss?: string;
  logoCss?: string;
}

// Format Configuration
export interface ImageFormat {
  order: string[];
  quality: Record<string, number>;
  extensions: Record<string, string>;
}

// Retina Configuration
export interface RetinaConfig {
  scales: number[];
  suffixes: Record<string, string>;
}

// Entity-specific Configuration
export interface EntityConfig {
  basePath: string;
  directoryNaming: string;
  fileNaming: string;
  sizes: Record<string, SizeConfig>;
}

// Processing Configuration
export interface ProcessingConfig {
  fit: string;
  position: string;
  preventUpscaling: boolean;
  requestDelayMs: number;
}

// API Configuration
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

// Complete Image Configuration
export interface ImageConfig {
  version: string;
  formats: ImageFormat;
  retina: RetinaConfig;
  entities: Record<string, EntityConfig>;
  processing: ProcessingConfig;
  api: ApiConfig;
}

// URL Generation Options
export interface ImageUrlOptions {
  entityType: EntityType;
  entityId: string;
  size: ImageSize;
  format: ImageFormatType;
  retinaScale?: RetinaScale;
}

// CSS Class Options
export interface CssClassOptions {
  entityType: EntityType;
  size: ImageSize;
  type: 'main' | 'iconFallback' | 'badge' | 'container' | 'logo';
}

// Hook Options for useResponsiveImage
export interface ResponsiveImageOptions {
  baseUrl: string;
  size: ImageSize;
  formats?: ImageFormatType[];
  playerId?: string;
}

// Image Loading States
export type ImageLoadingState = 'loading' | 'loaded' | 'error' | 'idle';

// Image Component Props (internal)
export interface ImageComponentState {
  loadingState: ImageLoadingState;
  currentSrc: string | null;
  fallbackUsed: boolean;
  retryCount: number;
}

// Fallback Configuration
export interface FallbackConfig {
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  showPlaceholder: boolean;
  placeholderSrc?: string;
}

// Performance Options
export interface ImagePerformanceOptions {
  lazy?: boolean;
  preload?: boolean;
  priority?: 'high' | 'low' | 'auto';
  decoding?: 'async' | 'sync' | 'auto';
  loading?: 'lazy' | 'eager';
}

// Browser Support Detection
export interface FormatSupport {
  avif: boolean;
  webp: boolean;
  png: boolean;
}

// Image Optimization Options
export interface OptimizationOptions {
  quality?: number;
  format?: ImageFormatType;
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: string;
}

// Cache Configuration
export interface ImageCacheConfig {
  maxAge: number;
  maxSize: number;
  strategy: 'lru' | 'lfu' | 'fifo';
}

// Frontend-specific Default Configurations
export const DEFAULT_IMAGE_CONFIG: Partial<ImageConfig> = {
  formats: {
    order: ['avif', 'webp', 'png'],
    quality: {
      avif: 80,
      webp: 85,
      png: 90
    },
    extensions: {
      avif: '.avif',
      webp: '.webp',
      png: '.png'
    }
  },
  retina: {
    scales: [1, 2, 3],
    suffixes: {
      '1': '',
      '2': '@2x',
      '3': '@3x'
    }
  }
};

export const DEFAULT_SIZE_CONFIGS: Record<ImageSize, SizeConfig> = {
  tiny: {
    width: 16,
    height: 16,
    css: 'w-4 h-4',
    retinaScales: [1, 2],
    iconFallbackCss: 'w-4 h-4',
    containerCss: 'w-4 h-4'
  },
  small: {
    width: 32,
    height: 32,
    css: 'w-8 h-8',
    retinaScales: [1, 2, 3],
    iconFallbackCss: 'w-8 h-8',
    containerCss: 'w-8 h-8'
  },
  medium: {
    width: 64,
    height: 64,
    css: 'w-16 h-16',
    retinaScales: [1, 2, 3],
    iconFallbackCss: 'w-16 h-16',
    containerCss: 'w-16 h-16'
  },
  large: {
    width: 128,
    height: 128,
    css: 'w-32 h-32',
    retinaScales: [1, 2, 3],
    iconFallbackCss: 'w-32 h-32',
    containerCss: 'w-32 h-32'
  }
};

export const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  enabled: true,
  maxRetries: 3,
  retryDelay: 1000,
  showPlaceholder: true
};

export const DEFAULT_PERFORMANCE_OPTIONS: ImagePerformanceOptions = {
  lazy: true,
  preload: false,
  priority: 'auto',
  decoding: 'async',
  loading: 'lazy'
};