import { useState } from 'react';

export interface SourceSet {
  srcSet: string;
  type: string;
}

export interface CascadingImageProps {
  imageUrls: string[];
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  onError?: () => void;
  onClick?: () => void;
  placeholder?: React.ReactNode;
  style?: React.CSSProperties;
  // Optional responsive support
  sourceSets?: SourceSet[];
}

/**
 * Cascading Image component with automatic fallback and responsive support
 * Tries each URL in the array until one loads successfully
 * Shows placeholder when all URLs fail
 * Supports responsive images with srcSet when sourceSets are provided
 */
export default function CascadingImage({
  imageUrls,
  alt,
  className = '',
  loading = 'lazy',
  onError,
  onClick,
  placeholder,
  style,
  sourceSets
}: CascadingImageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleImageError = () => {
    // Call optional external error handler
    onError?.();

    // Try next URL if available
    if (currentIndex < imageUrls.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Show placeholder when no URLs provided or all URLs failed
  if (!imageUrls.length || currentIndex >= imageUrls.length) {
    return placeholder ? (
      <div className={className} onClick={onClick} style={style}>
        {placeholder}
      </div>
    ) : null;
  }

  // Use picture element with responsive sources if provided
  if (sourceSets && sourceSets.length > 0) {
    return (
      <picture className={className} onClick={onClick} style={style}>
        {sourceSets.map((source, index) => (
          <source
            key={index}
            srcSet={source.srcSet}
            type={source.type}
          />
        ))}
        <img
          src={imageUrls[currentIndex]}
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
      src={imageUrls[currentIndex]}
      alt={alt}
      loading={loading}
      onError={handleImageError}
      onClick={onClick}
      className={className}
      style={style}
    />
  );
}