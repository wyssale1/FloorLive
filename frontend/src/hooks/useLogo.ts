import { useState, useEffect } from 'react';

interface LogoInfo {
  teamId: string;
  available: boolean;
  urls: {
    large: Record<string, string>;
    small: Record<string, string>;
  } | null;
}

/**
 * Hook to check logo availability and get URLs
 */
export function useLogo(teamId: string) {
  const [logoInfo, setLogoInfo] = useState<LogoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;

    const fetchLogoInfo = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/logos/team-${teamId}/info`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setLogoInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch logo info');
        setLogoInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLogoInfo();
  }, [teamId]);

  return {
    logoInfo,
    loading,
    error,
    hasLogo: logoInfo?.available ?? false
  };
}

// Global browser format support cache (computed once per session)
let formatSupport: { avif: boolean; webp: boolean } | null = null;

const detectFormatSupport = (): { avif: boolean; webp: boolean } => {
  if (formatSupport) return formatSupport;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  formatSupport = {
    avif: canvas.toDataURL('image/avif').startsWith('data:image/avif'),
    webp: canvas.toDataURL('image/webp').startsWith('data:image/webp')
  };
  
  return formatSupport;
};

/**
 * Hook to get optimized logo URL based on browser support
 * Optimized to avoid expensive operations on every render
 */
export function useOptimalLogoUrl(
  logoUrls?: Record<string, string>,
  fallback?: string
): string | null {
  if (!logoUrls) return fallback || null;
  
  // Detect format support once and cache globally
  const support = detectFormatSupport();
  
  // Return best available format immediately (no state/effects needed)
  if (logoUrls.avif && support.avif) {
    return logoUrls.avif;
  } else if (logoUrls.webp && support.webp) {
    return logoUrls.webp;
  } else if (logoUrls.png) {
    return logoUrls.png;
  }
  
  return fallback || null;
}