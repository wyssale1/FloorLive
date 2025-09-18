import { User } from 'lucide-react';
import OptimizedImage from './OptimizedImage';
import { convertImageInfo } from '../lib/imageUtils';

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
  jerseyNumber?: string | number;
  showNumberBadge?: boolean;
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
  jerseyNumber,
  showNumberBadge = false,
  imageInfo
}: PlayerImageProps) {

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

  const badgeSizes = {
    large: 'w-6 h-6 text-[10px]',
    medium: 'w-5 h-5 text-[9px]',
    small: 'w-4 h-4 text-[8px]'
  };

  // Convert imageInfo to the new format
  const providedUrls = convertImageInfo(imageInfo, size === 'large' ? 'medium' : 'small');

  // Determine image options for OptimizedImage
  const imageOptions = {
    // Use processed images if we have a player ID
    baseId: player.id,
    basePath: '/assets/players',
    size: (size === 'large' ? 'medium' : 'small') as 'small' | 'medium',

    // Use provided URLs if available
    providedUrls,

    // Fallback to legacy profile image
    legacyUrl: player.profileImage,

    enableResponsive: true
  };
  
  // Fallback component for when no image is available
  const FallbackIcon = fallbackIcon || (jerseyNumber ? (
    <span className="text-xs font-medium text-gray-700">
      {jerseyNumber}
    </span>
  ) : (
    <User className={`${iconSizes[size]} text-gray-400`} />
  ));

  const fallbackComponent = (
    <div className={`${sizeClasses[size]} bg-gray-100 rounded-full flex items-center justify-center`}>
      {FallbackIcon}
    </div>
  );

  return (
    <div className={`relative inline-block ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 ${onClick && !hideCursor ? 'cursor-pointer' : ''}`} onClick={onClick}>
        <OptimizedImage
          {...imageOptions}
          alt={`${player.name} portrait`}
          className="w-full h-full object-cover"
          loading="lazy"
          fallbackComponent={fallbackComponent}
        />
      </div>
      {showNumberBadge && jerseyNumber && (
        <div className={`absolute -bottom-1 -right-1 ${badgeSizes[size]} bg-gray-100 text-gray-700 rounded-full flex items-center justify-center font-medium border border-white`}>
          {jerseyNumber}
        </div>
      )}
    </div>
  );

}