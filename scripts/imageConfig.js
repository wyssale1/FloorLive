/**
 * Image Configuration - Single Source of Truth
 *
 * This configuration mirrors the values from frontend/src/types/images.ts but in JavaScript format
 * so that scripts can import it. This follows the DRY principle from CLAUDE.md guidelines.
 *
 * IMPORTANT: When making size changes (like "w-32 h-32"), update both:
 * - This file (for scripts)
 * - frontend/src/types/images.ts (for frontend)
 *
 * The values here should always match the TypeScript configuration.
 */

export const DEFAULT_IMAGE_CONFIG = {
  formats: {
    order: ['avif', 'webp', 'png'],
    quality: {
      avif: 80,
      webp: 85,
      png: 90
    },
    extensions: {
      avif: '.avif',
      webp: '.webp',
      png: '.png'
    }
  },
  retina: {
    scales: [1, 2, 3],
    suffixes: {
      '1': '',
      '2': '2x',
      '3': '3x'
    }
  }
};

export const DEFAULT_SIZE_CONFIGS = {
  tiny: {
    width: 16,
    height: 16,
    css: 'w-4 h-4',
    retinaScales: [1, 2]
  },
  small: {
    width: 32,
    height: 32,
    css: 'w-8 h-8',
    retinaScales: [1, 2, 3]
  },
  medium: {
    width: 64,
    height: 64,
    css: 'w-16 h-16',
    retinaScales: [1, 2, 3]
  }
};