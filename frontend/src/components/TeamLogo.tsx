import { Shield } from 'lucide-react'
import { memo, useMemo } from 'react'
import OptimizedImage from './OptimizedImage'
import { getImageUtils } from '../utils/imageConfigLoader'
import type { LogoUrls } from '../types/domain'

interface TeamLogoProps {
  team: {
    id: string;
    name: string;
    logo?: string; // Swiss Unihockey logo URL
    logoUrls?: LogoUrls;
    hasLogo?: boolean;
  };
  size?: 'tiny' | 'small' | 'large';
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
    size: size as 'tiny' | 'small' | 'large',
    providedUrls: team.logoUrls?.[size as keyof LogoUrls],
    fallbackUrl: showSwissUnihockeyFallback ? team.logo : undefined,
    enableResponsive: false // Teams logos don't need responsive variants
  }), [team.id, team.logoUrls, size, showSwissUnihockeyFallback, team.logo])

  // Size configurations from centralized config (memoized constants)
  const { sizeClasses, iconSizes, containerClasses, logoClasses } = useMemo(() => {
    const utils = getImageUtils();
    return {
      sizeClasses: {
        tiny: utils.getCssClasses({ entityType: 'teams', size: 'tiny', type: 'main' }),
        small: utils.getCssClasses({ entityType: 'teams', size: 'small', type: 'main' }),
        large: utils.getCssClasses({ entityType: 'teams', size: 'large', type: 'main' })
      },
      iconSizes: {
        tiny: utils.getCssClasses({ entityType: 'teams', size: 'tiny', type: 'iconFallback' }),
        small: utils.getCssClasses({ entityType: 'teams', size: 'small', type: 'iconFallback' }),
        large: utils.getCssClasses({ entityType: 'teams', size: 'large', type: 'iconFallback' })
      },
      containerClasses: {
        tiny: utils.getCssClasses({ entityType: 'teams', size: 'tiny', type: 'container' }),
        small: utils.getCssClasses({ entityType: 'teams', size: 'small', type: 'container' }),
        large: utils.getCssClasses({ entityType: 'teams', size: 'large', type: 'container' })
      },
      logoClasses: {
        tiny: utils.getCssClasses({ entityType: 'teams', size: 'tiny', type: 'logo' }),
        small: utils.getCssClasses({ entityType: 'teams', size: 'small', type: 'logo' }),
        large: utils.getCssClasses({ entityType: 'teams', size: 'large', type: 'logo' })
      }
    };
  }, [])

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