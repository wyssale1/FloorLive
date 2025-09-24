import { User } from 'lucide-react';
import ResponsiveCascadingImage from './ResponsiveCascadingImage';
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

  // Fallback component for when no image is available
  const FallbackIcon = fallbackIcon || (jerseyNumber ? (
    <span className="text-xs font-medium text-gray-700">
      {jerseyNumber}
    </span>
  ) : (
    <User className={`${iconSizes[size]} text-gray-400`} />
  ));

  const fallbackComponent = (
    <div className={`bg-gray-100 rounded-full flex items-center justify-center`}>
      {FallbackIcon}
    </div>
  );

  return (
    <div className={`relative inline-block ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 ${onClick && !hideCursor ? 'cursor-pointer' : ''}`} onClick={onClick}>
        <ResponsiveCascadingImage
          entityType="player"
          entityId={player.id}
          size={(size === 'large' ? 'medium' : 'small') as 'small' | 'medium'}
          alt={`${player.name} portrait`}
          className="w-full h-full object-cover"
          loading="lazy"
          onClick={onClick}
          placeholder={fallbackComponent}
          externalUrl={player.profileImage}
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