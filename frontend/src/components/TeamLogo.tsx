import { Shield } from 'lucide-react'
import { memo, useMemo } from 'react'
import OptimizedImage from './OptimizedImage'
import { DEFAULT_SIZE_CONFIGS } from '../types/images'
import type { LogoUrls } from '../types/domain'

interface TeamLogoProps {
  team: {
    id: string;
    name: string;
    logo?: string; // Swiss Unihockey logo URL (now passed from parent)
    logoUrls?: LogoUrls;
    hasLogo?: boolean;
  };
  size?: 'tiny' | 'small' | 'medium';
  className?: string;
  fallbackIcon?: React.ReactNode;
  showSwissUnihockeyFallback?: boolean;
  variant?: 'default' | 'square';
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
  // Logo is now expected to be passed directly from parent (e.g., from useGameLogos hook in GameCard)
  const imageOptions = useMemo(() => ({
    baseId: `team-${team.id}`,
    basePath: '/assets/teams',
    size: size as 'tiny' | 'small' | 'medium',
    providedUrls: team.logoUrls?.[size as keyof LogoUrls],
    fallbackUrl: showSwissUnihockeyFallback ? (team.logo || undefined) : undefined,
    enableResponsive: false
  }), [team.id, team.logoUrls, size, showSwissUnihockeyFallback, team.logo])

  const sizeClass = DEFAULT_SIZE_CONFIGS[size].css;

  const wrapInSquareContainer = (content: React.ReactNode) => {
    if (variant !== 'square') {
      return content;
    }

    return (
      <div className={`${sizeClass} bg-white border border-gray-100 rounded-lg shadow-sm flex items-center justify-center p-2 ${className}`}>
        {content}
      </div>
    );
  };

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
  ), [imageOptions, team.name, sizeClass, className, variant, fallbackComponent])

  return wrapInSquareContainer(logoElement)
}

export default memo(TeamLogo)