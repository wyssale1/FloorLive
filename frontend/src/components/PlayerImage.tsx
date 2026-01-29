import { User } from 'lucide-react';
import { DEFAULT_SIZE_CONFIGS } from '../types/images';
import { usePlayerImage } from '../hooks/usePlayerImage';

interface PlayerImageProps {
  player: {
    id: string;
    name: string;
    profileImage?: string;
  };
  size?: 'medium' | 'small';
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
    <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-2xs border border-white">
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

  // Lazy load image if not provided
  const { profileImage } = usePlayerImage(player.id, player.profileImage);

  const sizeClass = DEFAULT_SIZE_CONFIGS[size].css;
  const containerClasses = `${sizeClass} rounded-full overflow-hidden bg-gray-100 ${onClick && !hideCursor ? 'cursor-pointer' : ''}`;

  // Render API image
  const renderApiImage = () => (
    <img
      src={profileImage!}
      alt={`${player.name} portrait`}
      loading="lazy"
      className="w-full h-full object-cover"
    />
  );

  // Render fallback (jersey number or icon)
  const renderFallbackContent = () => {
    if (fallbackIcon) return fallbackIcon;

    if (jerseyNumber) {
      return (
        <span className="text-xs font-medium text-gray-500">
          {jerseyNumber}
        </span>
      );
    }

    return <User className={`${sizeClass} text-gray-400`} />;
  };

  const hasImage = !!profileImage;
  const content = hasImage ? renderApiImage() : renderFallbackContent();
  const centeringClasses = hasImage ? '' : 'flex items-center justify-center';
  const showBadge = hasImage || !jerseyNumber;

  return (
    <div className={`relative inline-block ${className}`}>
      <div className={`${containerClasses} ${centeringClasses}`} onClick={onClick}>
        {content}
      </div>
      <JerseyBadge jerseyNumber={jerseyNumber} showNumberBadge={showNumberBadge && showBadge} />
    </div>
  );
}