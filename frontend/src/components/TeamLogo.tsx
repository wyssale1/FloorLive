import { Shield } from 'lucide-react'
import { memo, useMemo } from 'react'
import OptimizedImage from './OptimizedImage'

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

function TeamLogo({ 
  team, 
  size = 'small', 
  className = '', 
  fallbackIcon,
  showSwissUnihockeyFallback = false,
  variant = 'default'
}: TeamLogoProps) {
  // Prepare image options for OptimizedImage (memoized)
  const imageOptions = useMemo(() => ({
    baseId: `team-${team.id}`,
    basePath: '/assets/teams',
    size: size as 'small' | 'large',
    providedUrls: team.logoUrls?.[size],
    fallbackUrl: showSwissUnihockeyFallback ? team.logo : undefined,
    enableResponsive: false // Teams logos don't need responsive variants
  }), [team.id, team.logoUrls, size, showSwissUnihockeyFallback, team.logo])

  // Size configurations (memoized constants)
  const { sizeClasses, iconSizes, containerClasses, logoClasses } = useMemo(() => ({
    sizeClasses: {
      large: 'w-16 h-16',
      small: 'w-5 h-5'
    },
    iconSizes: {
      large: 'w-12 h-12',
      small: 'w-4 h-4'
    },
    containerClasses: {
      large: 'w-16 h-16 sm:w-20 sm:h-20',
      small: 'w-8 h-8'
    },
    logoClasses: {
      large: 'w-12 h-12 sm:w-16 sm:h-16',
      small: 'w-6 h-6'
    }
  }), [])

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

  // Memoize fallback components
  const FallbackIcon = useMemo(() =>
    fallbackIcon || <Shield className={`${iconSizes[size]} text-gray-400`} />,
    [fallbackIcon, iconSizes, size]
  )

  const fallbackComponent = useMemo(() => (
    <div className={`${variant === 'square' ? logoClasses[size] : sizeClasses[size]} flex items-center justify-center`}>
      {FallbackIcon}
    </div>
  ), [variant, logoClasses, sizeClasses, size, FallbackIcon])

  const logoElement = useMemo(() => (
    <OptimizedImage
      {...imageOptions}
      alt={`${team.name} logo`}
      className={`${variant === 'square' ? logoClasses[size] : sizeClasses[size]} object-contain ${variant !== 'square' ? className : ''}`}
      loading="lazy"
      fallbackComponent={fallbackComponent}
    />
  ), [imageOptions, team.name, variant, logoClasses, sizeClasses, size, className, fallbackComponent])

  return wrapInSquareContainer(logoElement)
}

// Memoize the component to prevent unnecessary re-renders
export default memo(TeamLogo)