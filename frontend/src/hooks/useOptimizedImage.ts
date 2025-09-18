import { useState, useEffect } from 'react';
import { getFormatSupport, getCachedFormatSupport } from '../lib/imageFormatDetection';

export interface ImageUrls {
  avif?: string;
  webp?: string;
  png?: string;
  jpg?: string;
}

export interface OptimizedImageOptions {
  // For processed images with multiple formats/sizes
  baseId?: string; // player ID or team ID
  basePath?: string; // e.g., '/assets/players' or '/assets/teams'
  size?: 'small' | 'medium' | 'large';

  // For provided URLs (from API)
  providedUrls?: ImageUrls;

  // For single image URL (fallback)
  fallbackUrl?: string;

  // Responsive options
  enableResponsive?: boolean; // Enable 1x, 2x, 3x variants

  // Legacy support
  legacyUrl?: string;
}

export interface OptimizedImageResult {
  sources: Array<{
    srcSet: string;
    type: string;
  }>;
  fallbackSrc: string;
  isLoading: boolean;
  hasOptimizedFormat: boolean;
}

/**
 * Universal hook for optimized image handling
 * Supports both processed images and provided URLs with proper format detection
 */
export function useOptimizedImage(options: OptimizedImageOptions): OptimizedImageResult {
  const {
    baseId,
    basePath = '/assets/players',
    size = 'medium',
    providedUrls,
    fallbackUrl,
    enableResponsive = true,
    legacyUrl
  } = options;

  const [isLoading, setIsLoading] = useState(true);
  const [devicePixelRatio, setDevicePixelRatio] = useState(1);

  useEffect(() => {
    // Initialize format detection and get device pixel ratio
    const initializeSupport = async () => {
      await getFormatSupport();
      setDevicePixelRatio(window.devicePixelRatio || 1);
      setIsLoading(false);
    };

    initializeSupport();

    // Listen for changes in device pixel ratio
    const mediaQuery = window.matchMedia(`(min-resolution: ${window.devicePixelRatio}dppx)`);
    const handleChange = () => setDevicePixelRatio(window.devicePixelRatio || 1);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  /**
   * Generate responsive URLs for processed images
   */
  const generateResponsiveUrls = (format: string): Record<string, string> => {
    if (!baseId || !enableResponsive) {
      return {};
    }

    const urls: Record<string, string> = {
      '1x': `${basePath}/${baseId}/${baseId}_${size}.${format}`
    };

    // Add 2x variant
    urls['2x'] = `${basePath}/${baseId}/${baseId}_${size}2x.${format}`;

    // Add 3x variant (only for small images to avoid huge files)
    if (size === 'small') {
      urls['3x'] = `${basePath}/${baseId}/${baseId}_${size}3x.${format}`;
    }

    return urls;
  };

  /**
   * Generate srcSet string for a format
   */
  const generateSrcSet = (format: string, baseUrl?: string): string => {
    // If we have a base URL (provided), use it directly
    if (baseUrl) {
      return baseUrl;
    }

    // Generate responsive URLs for processed images
    if (baseId && enableResponsive) {
      const urls = generateResponsiveUrls(format);
      const srcSetParts: string[] = [];

      if (urls['1x']) srcSetParts.push(`${urls['1x']} 1x`);
      if (urls['2x']) srcSetParts.push(`${urls['2x']} 2x`);
      if (urls['3x']) srcSetParts.push(`${urls['3x']} 3x`);

      return srcSetParts.join(', ');
    }

    return '';
  };

  /**
   * Get the best fallback URL
   */
  const getFallbackUrl = (): string => {
    const support = getCachedFormatSupport();

    // Priority 1: Provided URLs with format preference
    if (providedUrls) {
      if (providedUrls.avif && support.avif) return providedUrls.avif;
      if (providedUrls.webp && support.webp) return providedUrls.webp;
      if (providedUrls.png) return providedUrls.png;
      if (providedUrls.jpg) return providedUrls.jpg;
    }

    // Priority 2: Generated URLs for processed images
    if (baseId) {
      const urls = generateResponsiveUrls('png'); // Fallback to PNG
      if (devicePixelRatio >= 2 && urls['2x']) return urls['2x'];
      if (urls['1x']) return urls['1x'];
    }

    // Priority 3: Explicit fallback URL
    if (fallbackUrl) return fallbackUrl;

    // Priority 4: Legacy URL
    if (legacyUrl) return legacyUrl;

    return '';
  };

  /**
   * Generate picture sources for modern browsers
   */
  const generateSources = (): Array<{ srcSet: string; type: string }> => {
    const sources: Array<{ srcSet: string; type: string }> = [];
    const support = getCachedFormatSupport();

    // Add AVIF source if supported
    if (support.avif) {
      let srcSet = '';
      if (providedUrls?.avif) {
        srcSet = providedUrls.avif;
      } else if (baseId) {
        srcSet = generateSrcSet('avif');
      }

      if (srcSet) {
        sources.push({ srcSet, type: 'image/avif' });
      }
    }

    // Add WebP source if supported
    if (support.webp) {
      let srcSet = '';
      if (providedUrls?.webp) {
        srcSet = providedUrls.webp;
      } else if (baseId) {
        srcSet = generateSrcSet('webp');
      }

      if (srcSet) {
        sources.push({ srcSet, type: 'image/webp' });
      }
    }

    return sources;
  };

  const sources = generateSources();
  const fallbackSrc = getFallbackUrl();
  const hasOptimizedFormat = sources.length > 0;

  return {
    sources,
    fallbackSrc,
    isLoading,
    hasOptimizedFormat
  };
}