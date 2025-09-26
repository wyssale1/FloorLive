import { Shield } from 'lucide-react'
import { memo, useMemo } from 'react'
import OptimizedImage from './OptimizedImage'
import { DEFAULT_SIZE_CONFIGS } from '../types/images'
import type { LogoUrls } from '../types/domain'

interface TeamLogoProps {
  team: {
    id: string;
    name: string;
    logo?: string; // Swiss Unihockey logo URL
    logoUrls?: LogoUrls;
    hasLogo?: boolean;
  };
  size?: 'tiny' | 'small' | 'medium';
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
    size: size as 'tiny' | 'small' | 'medium',
    providedUrls: team.logoUrls?.[size as keyof LogoUrls],
    fallbackUrl: showSwissUnihockeyFallback ? team.logo : undefined,
    enableResponsive: false // Teams logos don't need responsive variants
  }), [team.id, team.logoUrls, size, showSwissUnihockeyFallback, team.logo])

  // Simple size class from centralized config
  const sizeClass = DEFAULT_SIZE_CONFIGS[size].css; // e.g. 'w-16 h-16'

  // Helper function to wrap content in square container
  const wrapInSquareContainer = (content: React.ReactNode) => {
    if (variant !== 'square') {
      // For default variant, return content as-is (backward compatibility)
      return content;
    }
    
    return (
      <div className={`${sizeClass} bg-white border border-gray-100 rounded-lg shadow-sm flex items-center justify-center p-2 ${className}`}>
        {content}
      </div>
    );
  };

  // Memoize fallback components
  const FallbackIcon = useMemo(() =>
    fallbackIcon || <Shield className={`${sizeClass} text-gray-400`} />,
    [fallbackIcon, sizeClass]
  )

  const fallbackComponent = useMemo(() => (
    <div className={`${sizeClass} flex items-center justify-center`}>
      {FallbackIcon}
    </div>
  ), [sizeClass, FallbackIcon])

  const logoElement = useMemo(() => (
    <OptimizedImage
      {...imageOptions}
      alt={`${team.name} logo`}
      className={`${sizeClass} object-contain ${variant !== 'square' ? className : ''}`}
      loading="lazy"
      fallbackComponent={fallbackComponent}
    />
  ), [imageOptions, team.name, sizeClass, className, fallbackComponent])

  return wrapInSquareContainer(logoElement)
}

// Memoize the component to prevent unnecessary re-renders
export default memo(TeamLogo)