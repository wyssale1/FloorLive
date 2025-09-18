import type { ImageUrls } from '../hooks/useOptimizedImage';

/**
 * Helper function to convert legacy imageInfo format to ImageUrls
 */
export function convertImageInfo(imageInfo?: {
  hasImage: boolean;
  smallImageUrls?: {
    avif: string;
    webp: string;
    png: string;
  };
  mediumImageUrls?: {
    avif: string;
    webp: string;
    png: string;
  };
}, size: 'small' | 'medium' = 'small'): ImageUrls | undefined {
  if (!imageInfo?.hasImage) return undefined;

  const urls = size === 'medium' ? imageInfo.mediumImageUrls : imageInfo.smallImageUrls;
  if (!urls) return undefined;

  return {
    avif: urls.avif,
    webp: urls.webp,
    png: urls.png
  };
}