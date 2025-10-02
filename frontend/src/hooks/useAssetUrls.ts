/**
 * Hook for generating asset URLs for players and teams
 * Provides centralized URL generation based on known asset structure
 * Includes responsive/retina support (1x, 2x, 3x)
 */

import { useState, useEffect } from 'react';

export type EntityType = 'player' | 'team';
export type AssetSize = 'small' | 'medium' | 'large';
export type ImageFormat = 'avif' | 'webp' | 'png';

export interface ResponsiveUrls {
  '1x': string;
  '2x'?: string;
  '3x'?: string;
}

export interface AssetUrls {
  avif: string;
  webp: string;
  png: string;
}

export interface ResponsiveAssetUrls {
  avif: ResponsiveUrls;
  webp: ResponsiveUrls;
  png: ResponsiveUrls;
}

/**
 * Generate asset URLs for a given entity (player or team)
 * Based on our known asset structure: /assets/{entity}s/{entity}-{id}/{id}_{size}.{format}
 * This is a pure utility function, not a React hook
 */
export function generateAssetUrls(entityType: EntityType, entityId: string, size: AssetSize): AssetUrls {
  if (!entityId) {
    // Return empty URLs if no ID provided
    return {
      avif: '',
      webp: '',
      png: ''
    };
  }

  const entityPlural = entityType === 'player' ? 'players' : 'teams';
  const directory = `${entityType}-${entityId}`;
  const basePath = `/assets/${entityPlural}/${directory}`;
  const baseFileName = `${entityId}_${size}`;

  return {
    avif: `${basePath}/${baseFileName}.avif`,
    webp: `${basePath}/${baseFileName}.webp`,
    png: `${basePath}/${baseFileName}.png`
  };
}

/**
 * Generate all asset URLs for multiple sizes
 * Useful when you need URLs for different sizes at once
 * This is a pure utility function, not a React hook
 */
export function generateAssetUrlsMultiSize(entityType: EntityType, entityId: string, sizes: AssetSize[] = ['small', 'medium', 'large']): Record<AssetSize, AssetUrls> {
  if (!entityId) {
    const emptyUrls = { avif: '', webp: '', png: '' };
    return {
      small: emptyUrls,
      medium: emptyUrls,
      large: emptyUrls
    } as Record<AssetSize, AssetUrls>;
  }

  const result = {} as Record<AssetSize, AssetUrls>;

  for (const size of sizes) {
    result[size] = generateAssetUrls(entityType, entityId, size);
  }

  return result;
}

/**
 * Generate responsive URLs for a specific format
 * This is a pure utility function, not a React hook
 */
export function generateResponsiveAssetUrls(entityType: EntityType, entityId: string, size: AssetSize): ResponsiveAssetUrls {
  if (!entityId) {
    const emptyUrls = { '1x': '' };
    return {
      avif: emptyUrls,
      webp: emptyUrls,
      png: emptyUrls
    };
  }

  const entityPlural = entityType === 'player' ? 'players' : 'teams';
  const directory = `${entityType}-${entityId}`;
  const basePath = `/assets/${entityPlural}/${directory}`;
  const baseFileName = `${entityId}_${size}`;

  const buildResponsiveUrls = (format: ImageFormat): ResponsiveUrls => {
    const urls: ResponsiveUrls = {
      '1x': `${basePath}/${baseFileName}.${format}`
    };

    // Add 2x variant
    urls['2x'] = `${basePath}/${baseFileName}2x.${format}`;

    // Add 3x variant (only for small images to avoid huge files)
    if (size === 'small') {
      urls['3x'] = `${basePath}/${baseFileName}3x.${format}`;
    }

    return urls;
  };

  return {
    avif: buildResponsiveUrls('avif'),
    webp: buildResponsiveUrls('webp'),
    png: buildResponsiveUrls('png')
  };
}

/**
 * Hook for responsive image URLs with device pixel ratio detection
 */
export function useResponsiveAssetUrlsWithDPR(
  entityType: EntityType,
  entityId: string,
  size: AssetSize,
  externalUrl?: string
) {
  const [devicePixelRatio, setDevicePixelRatio] = useState(1);

  useEffect(() => {
    const updateDPR = () => {
      setDevicePixelRatio(window.devicePixelRatio || 1);
    };

    updateDPR();

    // Listen for changes in device pixel ratio
    const mediaQuery = window.matchMedia(`(min-resolution: ${window.devicePixelRatio}dppx)`);
    const handleChange = () => updateDPR();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  const responsiveUrls = generateResponsiveAssetUrls(entityType, entityId, size);

  // Generate srcSet strings for each format
  const generateSrcSet = (format: ImageFormat): string => {
    const urls = responsiveUrls[format];
    const srcSetParts: string[] = [];

    if (urls['1x']) srcSetParts.push(`${urls['1x']} 1x`);
    if (urls['2x']) srcSetParts.push(`${urls['2x']} 2x`);
    if (urls['3x']) srcSetParts.push(`${urls['3x']} 3x`);

    return srcSetParts.join(', ');
  };

  // Get optimal URL for current device pixel ratio
  const getOptimalUrl = (format: ImageFormat): string => {
    const urls = responsiveUrls[format];

    if (devicePixelRatio >= 3 && urls['3x']) return urls['3x'];
    if (devicePixelRatio >= 2 && urls['2x']) return urls['2x'];
    return urls['1x'];
  };

  // Generate cascading URL array for fallback (with optimal DPR selection)
  const cascadingUrls = [
    getOptimalUrl('avif'),    // 1. Our AVIF (optimal DPR)
    getOptimalUrl('webp'),    // 2. Our WebP (optimal DPR)
    getOptimalUrl('png'),     // 3. Our PNG (optimal DPR)
    externalUrl               // 4. External URL
  ].filter(url => url && url.length > 0);

  return {
    devicePixelRatio,
    responsiveUrls,
    cascadingUrls,
    srcSets: {
      avif: generateSrcSet('avif'),
      webp: generateSrcSet('webp'),
      png: generateSrcSet('png')
    },
    getOptimalUrl,
    isHighDPI: devicePixelRatio >= 2
  };
}

/**
 * Generate prioritized URL array for cascading fallback (legacy support)
 * Returns URLs in order: AVIF -> WebP -> PNG -> External URL
 */
export function useAssetUrlArray(
  entityType: EntityType,
  entityId: string,
  size: AssetSize,
  externalUrl?: string
): string[] {
  const assetUrls = generateAssetUrls(entityType, entityId, size);

  const urls = [
    assetUrls.avif,   // 1. Our AVIF (best quality)
    assetUrls.webp,   // 2. Our WebP (good performance)
    assetUrls.png,    // 3. Our PNG (browser fallback)
    externalUrl       // 4. External URL (e.g., Swiss Unihockey API)
  ];

  // Filter out undefined/empty URLs
  return urls.filter((url): url is string => url != null && url.length > 0);
}