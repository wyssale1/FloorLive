import { User } from 'lucide-react';
import { getImageUtils } from '../utils/imageConfigLoader';

interface PlayerImageProps {
  player: {
    id: string;
    name: string;
    hasProcessedImages?: boolean;
    profileImage?: string;
  };
  size?: 'large' | 'medium' | 'small';
  className?: string;
  fallbackIcon?: React.ReactNode;
  onClick?: () => void;
  hideCursor?: boolean;
  jerseyNumber?: string | number;
  showNumberBadge?: boolean;
}

export default function PlayerImage({
  player,
  size = 'medium',
  className = '',
  fallbackIcon,
  onClick,
  hideCursor = false,
  jerseyNumber,
  showNumberBadge = false
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

  // Generate responsive sizes based on component size
  const getSizesAttribute = () => {
    switch (size) {
      case 'small': return '64px';
      case 'large': return '128px';
      default: return '96px';
    }
  };

  // Generate srcSet with viewport optimization
  const generateSrcSet = (format: string) => {
    const baseUrl = `/assets/players/player-${player.id}/${player.id}`;
    return [
      `${baseUrl}_small.${format} 64w`,
      `${baseUrl}_small2x.${format} 128w`,
      `${baseUrl}_small3x.${format} 192w`,
      `${baseUrl}_medium.${format} 96w`,
      `${baseUrl}_medium2x.${format} 192w`,
      `${baseUrl}_medium3x.${format} 288w`,
      `${baseUrl}_large.${format} 128w`,
      `${baseUrl}_large2x.${format} 256w`,
      `${baseUrl}_large3x.${format} 384w`
    ].join(', ');
  };

  // Priority 1: If player has processed images, use Picture element with format + viewport optimization
  if (player.hasProcessedImages) {
    const sizesAttr = getSizesAttribute();
    const fallbackSrc = `/assets/players/player-${player.id}/${player.id}_${size}.png`;

    return (
      <div className={`relative inline-block ${className}`}>
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 ${onClick && !hideCursor ? 'cursor-pointer' : ''}`} onClick={onClick}>
          <picture className="w-full h-full">
            <source
              srcSet={generateSrcSet('avif')}
              sizes={sizesAttr}
              type="image/avif"
            />
            <source
              srcSet={generateSrcSet('webp')}
              sizes={sizesAttr}
              type="image/webp"
            />
            <img
              src={fallbackSrc}
              srcSet={generateSrcSet('png')}
              sizes={sizesAttr}
              alt={`${player.name} portrait`}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </picture>
        </div>
        {showNumberBadge && jerseyNumber && (
          <div className={`text-2xs absolute -bottom-1 -right-1 ${badgeSizes[size]} bg-gray-100 text-gray-700 rounded-full flex items-center justify-center font-medium border border-white`}>
            {jerseyNumber}
          </div>
        )}
      </div>
    );
  }

  // Priority 2: If no processed images but has profileImage from Swiss Unihockey API, show it
  if (player.profileImage) {
    return (
      <div className={`relative inline-block ${className}`}>
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 ${onClick && !hideCursor ? 'cursor-pointer' : ''}`} onClick={onClick}>
          <img
            src={player.profileImage}
            alt={`${player.name} portrait`}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
        {showNumberBadge && jerseyNumber && (
          <div className={`text-2xs absolute -bottom-1 -right-1 ${badgeSizes[size]} bg-gray-100 text-gray-700 rounded-full flex items-center justify-center font-medium border border-white`}>
            {jerseyNumber}
          </div>
        )}
      </div>
    );
  }

  // No processed images - show jersey number small and subtle in center (no badge)
  const FallbackContent = fallbackIcon || (jerseyNumber ? (
    <span className="text-xs font-medium text-gray-500">
      {jerseyNumber}
    </span>
  ) : (
    <User className={`${iconSizes[size]} text-gray-400`} />
  ));

  return (
    <div className={`relative inline-block ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 ${onClick && !hideCursor ? 'cursor-pointer' : ''} flex items-center justify-center`} onClick={onClick}>
        {FallbackContent}
      </div>
    </div>
  );
}