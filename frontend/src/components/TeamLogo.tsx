import { Shield } from 'lucide-react';
import { useOptimalLogoUrl } from '../hooks/useLogo';

interface TeamLogoProps {
  team: {
    id: string;
    name: string;
    logo?: string; // Swiss Unihockey logo URL
    logoUrls?: {
      large: Record<string, string>;
      small: Record<string, string>;
    };
    hasLogo?: boolean;
  };
  size?: 'large' | 'small';
  className?: string;
  fallbackIcon?: React.ReactNode;
  showSwissUnihockeyFallback?: boolean; // New prop to control fallback behavior
}

export default function TeamLogo({ 
  team, 
  size = 'small', 
  className = '', 
  fallbackIcon,
  showSwissUnihockeyFallback = false 
}: TeamLogoProps) {
  const logoUrls = team.logoUrls?.[size];
  const optimalUrl = useOptimalLogoUrl(logoUrls);

  // Size configurations
  const sizeClasses = {
    large: 'w-16 h-16',
    small: 'w-5 h-5'
  };

  const iconSizes = {
    large: 'w-12 h-12',
    small: 'w-4 h-4'
  };

  // First priority: Optimized logos (our processed logos)
  if (optimalUrl) {
    return (
      <img
        src={optimalUrl}
        alt={`${team.name} logo`}
        className={`${sizeClasses[size]} object-contain ${className}`}
        loading="lazy"
      />
    );
  }

  // Second priority: Swiss Unihockey logo (only if allowed by context)
  if (showSwissUnihockeyFallback && team.logo) {
    return (
      <img
        src={team.logo}
        alt={`${team.name} logo`}
        className={`${sizeClasses[size]} object-contain ${className}`}
        loading="lazy"
      />
    );
  }

  // Final fallback: Icon placeholder
  const FallbackIcon = fallbackIcon || (
    <Shield className={`${iconSizes[size]} text-gray-400`} />
  );

  return (
    <div className={`${sizeClasses[size]} flex items-center justify-center ${className}`}>
      {FallbackIcon}
    </div>
  );
}