import { useState } from 'react';
import { useResponsiveAssetUrlsWithDPR } from '../hooks/useAssetUrls';

export interface ResponsiveCascadingImageProps {
  entityType: 'player' | 'team';
  entityId: string;
  size: 'small' | 'medium';
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  onError?: () => void;
  onClick?: () => void;
  placeholder?: React.ReactNode;
  style?: React.CSSProperties;
  externalUrl?: string;
}

/**
 * Responsive Cascading Image component
 * Automatically handles device pixel ratio, format fallbacks, and responsive images
 * Uses the new responsive asset URL generation
 */
export default function ResponsiveCascadingImage({
  entityType,
  entityId,
  size,
  alt,
  className = '',
  loading = 'lazy',
  onError,
  onClick,
  placeholder,
  style,
  externalUrl
}: ResponsiveCascadingImageProps) {
  const [currentFormatIndex, setCurrentFormatIndex] = useState(0);

  const {
    srcSets,
    cascadingUrls
  } = useResponsiveAssetUrlsWithDPR(entityType, entityId, size, externalUrl);

  const formats = ['avif', 'webp', 'png'] as const;
  const currentFormat = formats[currentFormatIndex];

  const handleImageError = () => {
    // Call optional external error handler
    onError?.();

    // Try next format if available
    if (currentFormatIndex < formats.length - 1) {
      setCurrentFormatIndex(currentFormatIndex + 1);
    } else {
      // All formats failed, try external URL if not already tried
      if (externalUrl && cascadingUrls.length > formats.length) {
        // External URL will be handled by cascading fallback
      }
    }
  };

  // Show placeholder when no URLs available or all failed
  if (!cascadingUrls.length || currentFormatIndex >= formats.length) {
    // Try external URL as final fallback
    if (externalUrl && currentFormatIndex === formats.length) {
      return (
        <img
          src={externalUrl}
          alt={alt}
          loading={loading}
          onError={() => setCurrentFormatIndex(formats.length + 1)}
          onClick={onClick}
          className={className}
          style={style}
        />
      );
    }

    return placeholder ? (
      <div className={className} onClick={onClick} style={style}>
        {placeholder}
      </div>
    ) : null;
  }

  const currentSrcSet = srcSets[currentFormat];

  // Use picture element for responsive images
  return (
    <picture className={className} onClick={onClick} style={style}>
      {/* Only show current format source - browser will handle format fallback via onError */}
      {currentSrcSet && (
        <source
          srcSet={currentSrcSet}
          type={`image/${currentFormat}`}
        />
      )}
      <img
        src={cascadingUrls[0]} // Fallback URL for browsers that don't support picture
        alt={alt}
        loading={loading}
        onError={handleImageError}
        className="w-full h-full object-cover"
      />
    </picture>
  );
}