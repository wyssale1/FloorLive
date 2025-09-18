import { useState } from 'react';
import { useOptimizedImage, type OptimizedImageOptions } from '../hooks/useOptimizedImage';

export interface OptimizedImageProps extends OptimizedImageOptions {
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  onError?: () => void;
  onClick?: () => void;
  fallbackComponent?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Universal optimized image component using modern picture element
 * Automatically serves AVIF/WebP when supported, with PNG/JPG fallback
 * Supports both processed images (with responsive variants) and provided URLs
 */
export default function OptimizedImage({
  alt,
  className = '',
  loading = 'lazy',
  onError,
  onClick,
  fallbackComponent,
  style,
  ...imageOptions
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const { sources, fallbackSrc } = useOptimizedImage(imageOptions);

  const handleImageError = () => {
    setImageError(true);
    onError?.();
  };

  // Show fallback component if image failed to load and one is provided
  if (imageError && fallbackComponent) {
    return (
      <div className={className} onClick={onClick} style={style}>
        {fallbackComponent}
      </div>
    );
  }

  // Show nothing if no valid image sources are available
  if (!fallbackSrc && !sources.length) {
    return fallbackComponent ? (
      <div className={className} onClick={onClick} style={style}>
        {fallbackComponent}
      </div>
    ) : null;
  }

  // Use picture element when we have optimized sources
  if (sources.length > 0 && !imageError) {
    return (
      <picture className={className} onClick={onClick} style={style}>
        {sources.map((source, index) => (
          <source
            key={index}
            srcSet={source.srcSet}
            type={source.type}
          />
        ))}
        <img
          src={fallbackSrc}
          alt={alt}
          loading={loading}
          onError={handleImageError}
          className="w-full h-full object-cover"
        />
      </picture>
    );
  }

  // Fallback to simple img element
  return (
    <img
      src={fallbackSrc}
      alt={alt}
      loading={loading}
      onError={handleImageError}
      onClick={onClick}
      className={className}
      style={style}
    />
  );
}

