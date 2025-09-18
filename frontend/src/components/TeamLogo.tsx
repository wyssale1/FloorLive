import { Shield } from 'lucide-react';
import OptimizedImage from './OptimizedImage';

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
  // Prepare image options for OptimizedImage
  const imageOptions = {
    baseId: `team-${team.id}`,
    basePath: '/assets/teams',
    size: size as 'small' | 'large',
    providedUrls: team.logoUrls?.[size],
    fallbackUrl: showSwissUnihockeyFallback ? team.logo : undefined,
    enableResponsive: false // Teams logos don't need responsive variants
  };

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

  // Fallback icon when no logo is available
  const FallbackIcon = fallbackIcon || (
    <Shield className={`${iconSizes[size]} text-gray-400`} />
  );

  const fallbackComponent = (
    <div className={`${variant === 'square' ? logoClasses[size] : sizeClasses[size]} flex items-center justify-center`}>
      {FallbackIcon}
    </div>
  );

  const logoElement = (
    <OptimizedImage
      {...imageOptions}
      alt={`${team.name} logo`}
      className={`${variant === 'square' ? logoClasses[size] : sizeClasses[size]} object-contain ${variant !== 'square' ? className : ''}`}
      loading="lazy"
      fallbackComponent={fallbackComponent}
    />
  );

  return wrapInSquareContainer(logoElement);
}