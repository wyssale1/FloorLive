import { User } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PlayerImageProps {
  player: {
    id: string;
    name: string;
    profileImage?: string;
  };
  size?: 'large' | 'medium' | 'small';
  className?: string;
  fallbackIcon?: React.ReactNode;
  onClick?: () => void;
  hideCursor?: boolean;
  imageInfo?: {
    hasImage: boolean;
    smallImageUrls?: {
      avif: string;
      webp: string;
      png: string;
    };
  };
}

export default function PlayerImage({ 
  player, 
  size = 'medium', 
  className = '', 
  fallbackIcon,
  onClick,
  hideCursor = false,
  imageInfo
}: PlayerImageProps) {
  const [imageError, setImageError] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);

  // Size configurations
  const sizeClasses = {
    large: 'w-20 h-20 sm:w-24 sm:h-24',
    medium: 'w-16 h-16 sm:w-20 sm:h-20', 
    small: 'w-8 h-8'
  };

  const iconSizes = {
    large: 'w-12 h-12 sm:w-14 sm:h-14',
    medium: 'w-8 h-8 sm:w-10 sm:h-10',
    small: 'w-4 h-4'
  };

  // Set processed image URL from team-provided data or API fallback
  useEffect(() => {
    // Reset state when player changes
    setImageError(false);
    setProcessedImageUrl(null);

    if (!player.id) {
      return;
    }

    // First priority: Use image URLs provided by team API
    if (imageInfo?.hasImage && imageInfo.smallImageUrls) {
      // For small size, use the small URLs provided
      // For medium/large sizes, we still use small URLs for team lists (they're already appropriate size)
      const preferredUrl = 
        imageInfo.smallImageUrls.avif || 
        imageInfo.smallImageUrls.webp || 
        imageInfo.smallImageUrls.png;
      
      if (preferredUrl) {
        setProcessedImageUrl(preferredUrl);
        return;
      }
    }

    // Fallback: Check individual player API (for cases where imageInfo wasn't provided)
    if (!imageInfo?.hasImage) {
      const checkProcessedImages = async () => {
        try {
          const response = await fetch(`/api/players/${player.id}/images`);
          if (response.ok) {
            const data = await response.json();
            if (data.hasImage && data.imagePaths) {
              // Try to get the best image format for the current size
              const sizeKey = size === 'large' ? 'medium' : 'small'; // Map large to medium for processed images
              const imagePaths = data.imagePaths[sizeKey];
              
              if (imagePaths) {
                // Prefer AVIF, then WebP, then PNG
                const preferredUrl = 
                  imagePaths.avif || 
                  imagePaths.webp || 
                  imagePaths.png;
                
                if (preferredUrl) {
                  setProcessedImageUrl(preferredUrl);
                }
              }
            }
          }
        } catch (error) {
          // Silently fail - we'll fall back to original image or placeholder
          console.debug('Could not fetch processed image for player:', player.id);
        }
      };

      checkProcessedImages();
    }
  }, [player.id, size, imageInfo]);

  // Determine which image to show (prioritize processed images)
  const imageUrl = processedImageUrl || player.profileImage;
  
  // If we have an image and no error, show it
  if (imageUrl && !imageError) {
    return (
      <img
        src={imageUrl}
        alt={`${player.name} portrait`}
        className={`${sizeClasses[size]} rounded-full object-cover bg-gray-100 ${onClick && !hideCursor ? 'cursor-pointer' : ''} ${className}`}
        loading="lazy"
        onError={() => setImageError(true)}
        onClick={onClick}
      />
    );
  }

  // Fallback: Icon placeholder
  const FallbackIcon = fallbackIcon || (
    <User className={`${iconSizes[size]} text-gray-400`} />
  );

  return (
    <div 
      className={`${sizeClasses[size]} bg-gray-100 rounded-full flex items-center justify-center ${onClick && !hideCursor ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {FallbackIcon}
    </div>
  );
}