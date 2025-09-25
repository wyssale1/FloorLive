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

// Sub-component: Jersey Number Badge
const JerseyBadge = ({ jerseyNumber, showNumberBadge }: { jerseyNumber?: string | number; showNumberBadge?: boolean }) => {
  if (!showNumberBadge || !jerseyNumber) return null;

  return (
    <div className="absolute -bottom-1.5 -right-1.5 w-4.5 h-4.5 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-2xs font-medium border border-white">
      {jerseyNumber}
    </div>
  );
};

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

  // Shared constants and utilities
  const utils = getImageUtils();
  const COMMON_IMAGE_PROPS = {
    alt: `${player.name} portrait`,
    loading: 'lazy' as const,
    className: "w-full h-full object-cover"
  };

  // CSS class generators - centralized
  const getCssClasses = (type: 'main' | 'iconFallback') => ({
    large: utils.getCssClasses({ entityType: 'players', size: 'large', type }),
    medium: utils.getCssClasses({ entityType: 'players', size: 'medium', type }),
    small: utils.getCssClasses({ entityType: 'players', size: 'small', type })
  });

  const sizeClasses = getCssClasses('main');
  const iconSizes = getCssClasses('iconFallback');

  // Helper functions - extracted for reusability
  const getSizesAttribute = (): string => {
    const sizeMap = { small: '64px', large: '128px', medium: '96px' };
    return sizeMap[size];
  };

  const generateSrcSet = (format: string): string => {
    const baseUrl = `/assets/players/player-${player.id}/${player.id}`;
    const variants = [
      `${baseUrl}_small.${format} 64w`,
      `${baseUrl}_small2x.${format} 128w`,
      `${baseUrl}_small3x.${format} 192w`,
      `${baseUrl}_medium.${format} 96w`,
      `${baseUrl}_medium2x.${format} 192w`,
      `${baseUrl}_medium3x.${format} 288w`,
      `${baseUrl}_large.${format} 128w`,
      `${baseUrl}_large2x.${format} 256w`,
      `${baseUrl}_large3x.${format} 384w`
    ];
    return variants.join(', ');
  };

  // Shared container classes
  const containerClasses = `${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 ${onClick && !hideCursor ? 'cursor-pointer' : ''}`;

  // Content generators - DRY principle
  const renderProcessedImage = () => {
    const sizesAttr = getSizesAttribute();
    const fallbackSrc = `/assets/players/player-${player.id}/${player.id}_${size}.png`;

    return (
      <picture className="w-full h-full">
        <source srcSet={generateSrcSet('avif')} sizes={sizesAttr} type="image/avif" />
        <source srcSet={generateSrcSet('webp')} sizes={sizesAttr} type="image/webp" />
        <img src={fallbackSrc} srcSet={generateSrcSet('png')} sizes={sizesAttr} {...COMMON_IMAGE_PROPS} />
      </picture>
    );
  };

  const renderApiImage = () => (
    <img src={player.profileImage} {...COMMON_IMAGE_PROPS} />
  );

  const renderFallbackContent = () => {
    if (fallbackIcon) return fallbackIcon;

    if (jerseyNumber) {
      return (
        <span className="text-xs font-medium text-gray-500">
          {jerseyNumber}
        </span>
      );
    }

    return <User className={`${iconSizes[size]} text-gray-400`} />;
  };

  // Determine content type and render accordingly
  const getImageContent = () => {
    if (player.hasProcessedImages) {
      return { content: renderProcessedImage(), needsCentering: false, showBadge: true };
    }

    if (player.profileImage) {
      return { content: renderApiImage(), needsCentering: false, showBadge: true };
    }

    return { content: renderFallbackContent(), needsCentering: true, showBadge: !jerseyNumber };
  };

  // Single return - DRY principle applied
  const { content, needsCentering, showBadge } = getImageContent();
  const centeringClasses = needsCentering ? 'flex items-center justify-center' : '';

  return (
    <div className={`relative inline-block ${className}`}>
      <div className={`${containerClasses} ${centeringClasses}`} onClick={onClick}>
        {content}
      </div>
      <JerseyBadge jerseyNumber={jerseyNumber} showNumberBadge={showNumberBadge && showBadge} />
    </div>
  );
}