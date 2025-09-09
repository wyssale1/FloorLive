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
  variant?: 'default' | 'square'; // New prop for container variant
}

export default function TeamLogo({ 
  team, 
  size = 'small', 
  className = '', 
  fallbackIcon,
  showSwissUnihockeyFallback = false,
  variant = 'default'
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

  // Container configurations for square variant
  const containerClasses = {
    large: 'w-16 h-16 sm:w-20 sm:h-20', // Match the current header sizes
    small: 'w-8 h-8'
  };

  const logoClasses = {
    large: 'w-12 h-12 sm:w-16 sm:h-16', // Match the current logo sizes inside containers
    small: 'w-6 h-6'
  };

  // Helper function to wrap content in square container
  const wrapInSquareContainer = (content: React.ReactNode) => {
    if (variant !== 'square') {
      // For default variant, return content as-is (backward compatibility)
      return content;
    }
    
    return (
      <div className={`${containerClasses[size]} bg-white border border-gray-100 rounded-lg shadow-sm flex items-center justify-center p-2 ${className}`}>
        {content}
      </div>
    );
  };

  // First priority: Optimized logos (our processed logos)
  if (optimalUrl) {
    const logoElement = (
      <img
        src={optimalUrl}
        alt={`${team.name} logo`}
        className={`${variant === 'square' ? logoClasses[size] : sizeClasses[size]} object-contain ${variant !== 'square' ? className : ''}`}
        loading="lazy"
      />
    );

    return wrapInSquareContainer(logoElement);
  }

  // Second priority: Swiss Unihockey logo (only if allowed by context)
  if (showSwissUnihockeyFallback && team.logo) {
    const logoElement = (
      <img
        src={team.logo}
        alt={`${team.name} logo`}
        className={`${variant === 'square' ? logoClasses[size] : sizeClasses[size]} object-contain ${variant !== 'square' ? className : ''}`}
        loading="lazy"
      />
    );

    return wrapInSquareContainer(logoElement);
  }

  // Final fallback: Icon placeholder
  const FallbackIcon = fallbackIcon || (
    <Shield className={`${iconSizes[size]} text-gray-400`} />
  );

  const fallbackElement = (
    <div className={`${variant === 'square' ? logoClasses[size] : sizeClasses[size]} flex items-center justify-center ${variant !== 'square' ? className : ''}`}>
      {FallbackIcon}
    </div>
  );

  return wrapInSquareContainer(fallbackElement);
}