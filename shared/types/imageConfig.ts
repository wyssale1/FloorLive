/**
 * Centralized image configuration types
 * Used across frontend and backend for image processing and URL generation
 */

export interface ImageFormat {
  order: string[];
  quality: Record<string, number>;
  extensions: Record<string, string>;
}

export interface RetinaConfig {
  scales: number[];
  suffixes: Record<string, string>;
}

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

export interface EntityConfig {
  basePath: string;
  directoryNaming: string;
  fileNaming: string;
  sizes: Record<string, SizeConfig>;
}

export interface ProcessingConfig {
  fit: string;
  position: string;
  preventUpscaling: boolean;
  requestDelayMs: number;
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

export interface ImageConfig {
  version: string;
  formats: ImageFormat;
  retina: RetinaConfig;
  entities: Record<string, EntityConfig>;
  processing: ProcessingConfig;
  api: ApiConfig;
}

// Helper types for better type safety
export type EntityType = 'players' | 'teams';
export type ImageSize = 'small' | 'medium' | 'large';
export type ImageFormatType = 'avif' | 'webp' | 'png';
export type RetinaScale = 1 | 2 | 3;

// URL generation options
export interface ImageUrlOptions {
  entityType: EntityType;
  entityId: string;
  size: ImageSize;
  format: ImageFormatType;
  retinaScale?: RetinaScale;
}

// CSS class options
export interface CssClassOptions {
  entityType: EntityType;
  size: ImageSize;
  type: 'main' | 'iconFallback' | 'badge' | 'container' | 'logo';
}

// Responsive image URLs
export interface ResponsiveImageUrls {
  '1x': string;
  '2x'?: string;
  '3x'?: string;
}

// Image metadata for components
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