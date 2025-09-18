/**
 * Browser image format support detection utility
 * Uses modern feature detection methods for accurate AVIF and WebP support detection
 */

interface FormatSupport {
  avif: boolean;
  webp: boolean;
}

// Global cache to avoid repeated detection
let formatSupport: FormatSupport | null = null;

/**
 * Detect AVIF support using a minimal test image
 */
const detectAVIFSupport = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    // Minimal 1x1 AVIF image (base64 encoded)
    img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=';
  });
};

/**
 * Detect WebP support using a minimal test image
 */
const detectWebPSupport = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    // Minimal 1x1 WebP image (base64 encoded)
    img.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoBAAEALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

/**
 * Initialize format support detection
 * Called once and cached for the session
 */
const initializeFormatSupport = async (): Promise<FormatSupport> => {
  if (formatSupport) {
    return formatSupport;
  }

  const [avif, webp] = await Promise.all([
    detectAVIFSupport(),
    detectWebPSupport()
  ]);

  formatSupport = { avif, webp };
  return formatSupport;
};

/**
 * Get cached format support or initialize if not cached
 */
export const getFormatSupport = async (): Promise<FormatSupport> => {
  if (formatSupport) {
    return formatSupport;
  }
  return initializeFormatSupport();
};

/**
 * Synchronous version that returns cached support or defaults to false
 * Use this when you need immediate results and have already initialized
 */
export const getCachedFormatSupport = (): FormatSupport => {
  return formatSupport || { avif: false, webp: false };
};

/**
 * Get the best supported format from available formats
 * Prioritizes: AVIF > WebP > PNG/JPG
 */
export const getBestSupportedFormat = async (availableFormats: string[]): Promise<string> => {
  const support = await getFormatSupport();

  if (availableFormats.includes('avif') && support.avif) {
    return 'avif';
  }

  if (availableFormats.includes('webp') && support.webp) {
    return 'webp';
  }

  // Fallback to PNG or first available format
  return availableFormats.includes('png') ? 'png' : availableFormats[0];
};

/**
 * Initialize format detection on module load for immediate availability
 * This runs in the background and caches results for future use
 */
if (typeof window !== 'undefined') {
  initializeFormatSupport().catch(() => {
    // Silently fail and use defaults
    formatSupport = { avif: false, webp: false };
  });
}