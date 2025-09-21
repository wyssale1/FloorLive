import { useState, useEffect } from 'react';
import { getImageUtils } from '../utils/imageConfigLoader';
import type { ImageFormatType } from '../../../shared/types/imageConfig';

export interface ResponsiveImageUrls {
  '1x': string;
  '2x'?: string;
  '3x'?: string;
}

export interface ResponsiveImageOptions {
  baseUrl: string;
  size: 'small' | 'medium';
  formats?: ImageFormatType[];
  playerId?: string;
}

/**
 * Hook for managing responsive images based on device pixel ratio
 * Provides srcSet URLs for different pixel densities (1x, 2x, 3x)
 */
export function useResponsiveImage({
  baseUrl,
  size,
  formats,
  playerId
}: ResponsiveImageOptions) {
  // Get formats from centralized config if not provided
  const utils = getImageUtils();
  const configFormats = formats || utils.getAvailableFormats();
  const [devicePixelRatio, setDevicePixelRatio] = useState(1);

  useEffect(() => {
    // Get initial device pixel ratio
    const updateDPR = () => {
      setDevicePixelRatio(window.devicePixelRatio || 1);
    };

    updateDPR();

    // Listen for changes in device pixel ratio (rare but can happen)
    const mediaQuery = window.matchMedia(`(min-resolution: ${window.devicePixelRatio}dppx)`);
    
    const handleChange = () => updateDPR();
    
    // Use addEventListener if available, fallback to deprecated method
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  /**
   * Generate URLs for different pixel densities using centralized config
   */
  const generateResponsiveUrls = (format: string): ResponsiveImageUrls => {
    if (!playerId) {
      return { '1x': baseUrl };
    }

    try {
      const responsiveUrls = utils.generateResponsiveUrls('players', playerId, size as any, format as ImageFormatType);
      return responsiveUrls;
    } catch {
      // Fallback to legacy format if config-based generation fails
      return { '1x': baseUrl };
    }
  };

  /**
   * Generate srcSet string for responsive images
   */
  const generateSrcSet = (format: string): string => {
    const urls = generateResponsiveUrls(format);
    const srcSetParts: string[] = [];

    if (urls['1x']) srcSetParts.push(`${urls['1x']} 1x`);
    if (urls['2x']) srcSetParts.push(`${urls['2x']} 2x`);
    if (urls['3x']) srcSetParts.push(`${urls['3x']} 3x`);

    return srcSetParts.join(', ');
  };

  /**
   * Get the best format based on browser support
   */
  const getBestFormat = (): string => {
    // Check format support (simplified - in real app you might want more sophisticated detection)
    const canvas = document.createElement('canvas');

    // Check AVIF support
    if (configFormats.includes('avif') && canvas.toDataURL('image/avif').indexOf('image/avif') === 5) {
      return 'avif';
    }

    // Check WebP support
    if (configFormats.includes('webp') && canvas.toDataURL('image/webp').indexOf('image/webp') === 5) {
      return 'webp';
    }

    // Fallback to PNG
    return configFormats.includes('png') ? 'png' : configFormats[0];
  };

  /**
   * Get the optimal image URL for current device
   */
  const getOptimalUrl = (format?: string): string => {
    const selectedFormat = format || getBestFormat();
    const urls = generateResponsiveUrls(selectedFormat);
    
    if (devicePixelRatio >= 3 && urls['3x']) {
      return urls['3x'];
    } else if (devicePixelRatio >= 2 && urls['2x']) {
      return urls['2x'];
    }
    
    return urls['1x'];
  };

  return {
    devicePixelRatio,
    generateResponsiveUrls,
    generateSrcSet,
    getBestFormat,
    getOptimalUrl,
    // Convenience getters
    srcSet: playerId ? generateSrcSet(getBestFormat()) : undefined,
    src: playerId ? getOptimalUrl() : baseUrl,
    isHighDPI: devicePixelRatio >= 2
  };
}