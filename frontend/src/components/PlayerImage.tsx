import { User } from 'lucide-react';
import { useState } from 'react';

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
}

export default function PlayerImage({ 
  player, 
  size = 'medium', 
  className = '', 
  fallbackIcon,
  onClick,
  hideCursor = false
}: PlayerImageProps) {
  const [imageError, setImageError] = useState(false);

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

  // If we have a profile image and no error, show it
  if (player.profileImage && !imageError) {
    return (
      <img
        src={player.profileImage}
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