import { User } from 'lucide-react';
import OptimizedImage from './OptimizedImage';
import { convertImageInfo } from '../lib/imageUtils';
import { getImageUtils } from '../utils/imageConfigLoader';

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

  // Get CSS classes from centralized configuration
  const utils = getImageUtils();
  const sizeClasses = {
    large: utils.getCssClasses({ entityType: 'players', size: 'large', type: 'main' }),
    medium: utils.getCssClasses({ entityType: 'players', size: 'medium', type: 'main' }),
    small: utils.getCssClasses({ entityType: 'players', size: 'small', type: 'main' })
  };

  const iconSizes = {
    large: utils.getCssClasses({ entityType: 'players', size: 'large', type: 'iconFallback' }),
    medium: utils.getCssClasses({ entityType: 'players', size: 'medium', type: 'iconFallback' }),
    small: utils.getCssClasses({ entityType: 'players', size: 'small', type: 'iconFallback' })
  };

  const badgeSizes = {
    large: utils.getCssClasses({ entityType: 'players', size: 'large', type: 'badge' }),
    medium: utils.getCssClasses({ entityType: 'players', size: 'medium', type: 'badge' }),
    small: utils.getCssClasses({ entityType: 'players', size: 'small', type: 'badge' })
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