# Player Image Optimization Implementation Plan

## Overview

This document outlines the planned implementation for optimizing player image display on single player pages, with proper priority handling and high-DPI support. This was attempted but reverted due to implementation issues.

## Goal

Optimize player image loading on single player detail pages (e.g., `http://100.99.89.57:5173/player/459038`) with the following priority order:

1. **First Priority**: Use processed/optimized images (with proper size and format optimization)  
2. **Second Priority**: Fall back to original API image from Swiss Unihockey  
3. **Third Priority**: Show placeholder icon

## Technical Requirements

### High-DPI Support
- Generate 1x, 2x, and 3x variants for different pixel densities
- Smart generation: only create high-DPI variants when original image is large enough
- Support modern image formats: AVIF → WebP → PNG (in order of preference)

### Size Variants
- **Small**: 48x48px (1x), 96x96px (2x), 144x144px (3x) - for team player lists
- **Medium**: 120x120px (1x), 240x240px (2x), 360x360px (3x) - for player detail pages

### Image Processing
- Use Sharp library for image processing and metadata extraction
- Check original image dimensions before generating high-DPI variants
- Only generate variants when original image has sufficient resolution

## Implementation Plan

### Backend Changes

#### 1. PlayerImageService Enhancements (`/backend/src/services/playerImageService.ts`)

**Add Medium3x Size Support:**
```typescript
private readonly SIZES = {
  small: { width: 48, height: 48 },
  small2x: { width: 96, height: 96 },
  small3x: { width: 144, height: 144 },
  medium: { width: 120, height: 120 },
  medium2x: { width: 240, height: 240 },
  medium3x: { width: 360, height: 360 } // NEW
};
```

**Smart Generation Logic:**
```typescript
private shouldGenerateSize(sizeName: string, originalWidth: number, originalHeight: number, targetDimensions: { width: number; height: number }): boolean {
  // Always generate 1x sizes
  if (!sizeName.includes('2x') && !sizeName.includes('3x')) {
    return true;
  }
  
  const minDimension = Math.min(originalWidth, originalHeight);
  
  if (sizeName.includes('3x')) {
    return minDimension >= targetDimensions.width;
  }
  
  if (sizeName.includes('2x')) {
    return minDimension >= targetDimensions.width;
  }
  
  return true;
}
```

**Metadata Extraction with Sharp:**
```typescript
// Get original image dimensions for smart generation
const imageInfo = await sharp(imageBuffer).metadata();
const originalWidth = imageInfo.width || 0;
const originalHeight = imageInfo.height || 0;

// Process with smart generation
for (const [sizeName, dimensions] of Object.entries(this.SIZES)) {
  const shouldGenerate = this.shouldGenerateSize(sizeName, originalWidth, originalHeight, dimensions);
  
  if (!shouldGenerate) {
    console.log(`⏭️  Skipping ${sizeName} - original image too small`);
    continue;
  }
  // ... process image
}
```

**File Existence Checking:**
```typescript
// Fix ES module imports
import { promises as fs, existsSync } from 'fs';

// Only return paths for files that actually exist
getPlayerImagePaths(playerId: string): Record<string, Record<string, string>> | null {
  // ... existing logic
  
  for (const format of this.FORMATS) {
    const filepath = path.join(playerDir, filename);
    
    if (existsSync(filepath)) {
      sizeFiles[format] = `/assets/players/${playerId}/${filename}`;
    }
  }
  
  // Only include size if at least one format exists
  if (Object.keys(sizeFiles).length > 0) {
    paths[sizeName] = sizeFiles;
  }
}
```

### Frontend Changes

#### 1. PlayerDetail Page (`/frontend/src/pages/PlayerDetail.tsx`)

**Fetch Image Metadata:**
```typescript
// Add to existing useEffect
useEffect(() => {
  const fetchData = async () => {
    try {
      // ... existing player detail fetching
      
      // NEW: Fetch image metadata
      const imageResponse = await fetch(`/api/players/${playerId}/images`);
      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        setImageInfo(imageData);
      }
    } catch (error) {
      // Handle gracefully
    }
  };
  
  fetchData();
}, [playerId]);
```

**Pass imageInfo to PlayerImage:**
```typescript
<PlayerImage 
  player={playerData} 
  size="large" 
  imageInfo={imageInfo} // NEW
/>
```

#### 2. PlayerImage Component (`/frontend/src/components/PlayerImage.tsx`)

**Extend Interface:**
```typescript
interface PlayerImageProps {
  // ... existing props
  imageInfo?: {
    hasImage: boolean;
    imagePaths?: Record<string, Record<string, string>>; // NEW format
    smallImageUrls?: {  // Legacy format for team lists
      avif: string;
      webp: string;
      png: string;
    };
  };
}
```

**Priority Logic Implementation:**
```typescript
useEffect(() => {
  setImageError(false);
  setProcessedImageUrl(null);

  if (!player.id) return;

  // PRIORITY 1: Use processed images from imageInfo
  if (imageInfo?.hasImage && imageInfo.imagePaths) {
    const sizeKey = size === 'large' ? 'medium' : 'small';
    const imagePaths = imageInfo.imagePaths[sizeKey];
    
    if (imagePaths) {
      const preferredUrl = 
        imagePaths.avif || 
        imagePaths.webp || 
        imagePaths.png;
      
      if (preferredUrl) {
        setProcessedImageUrl(preferredUrl);
        return; // IMPORTANT: Return here to prevent fallback
      }
    }
  }

  // PRIORITY 2: Check individual player API (fallback)
  if (!imageInfo?.hasImage) {
    // ... existing fallback logic
  }
}, [player.id, size, imageInfo]);
```

#### 3. useResponsiveImage Hook (`/frontend/src/hooks/useResponsiveImage.ts`)

**Handle Processed URLs:**
```typescript
export interface ResponsiveImageOptions {
  baseUrl: string;
  size: 'small' | 'medium';
  formats?: ('avif' | 'webp' | 'png')[];
  playerId?: string;
  useProcessedUrl?: boolean; // NEW flag
}

// Return logic
return {
  // ... existing properties
  srcSet: (playerId && !useProcessedUrl) ? generateSrcSet(getBestFormat()) : undefined,
  src: (playerId && !useProcessedUrl) ? getOptimalUrl() : baseUrl,
  isHighDPI: devicePixelRatio >= 2
};
```

## Issues Encountered

### 1. ES Module Import Error
**Problem**: Used `const fs = require('fs');` in ES module context
**Error**: "require is not defined"
**Solution**: Use proper ES module imports: `import { existsSync } from 'fs';`

### 2. Priority Logic Failure
**Problem**: Processed images were not being prioritized correctly on single player pages
**Symptoms**: Swiss Unihockey URLs still being used instead of processed images
**Root Cause**: Complex interaction between useResponsiveImage hook and PlayerImage component logic

### 3. Hook Logic Confusion
**Problem**: useResponsiveImage hook was generating its own paths even when processed URLs were provided
**Attempted Fix**: Added `useProcessedUrl` flag, but this created additional complexity without solving the core issue

## Recommended Approach for Future Implementation

### 1. Simplify the Architecture
- **Single Source of Truth**: Make PlayerImage component fully responsible for image priority logic
- **Minimize Hook Complexity**: Keep useResponsiveImage focused only on device pixel ratio detection
- **Clear Separation**: Separate concerns between processed image handling and responsive image generation

### 2. Debug Strategy
- **Step-by-Step Testing**: Implement and test each piece in isolation
- **Logging**: Add extensive logging to trace image URL selection
- **Network Tab**: Monitor browser network requests to verify correct URLs are being requested

### 3. Fallback Strategy
- **Graceful Degradation**: Ensure that if processed images fail, the system falls back properly
- **Error Boundaries**: Implement proper error handling at each level
- **User Feedback**: Provide loading states and error states for better UX

### 4. Testing Approach
- **Unit Tests**: Test priority logic with mock data
- **Integration Tests**: Test full flow from API to display
- **Manual Testing**: Test on actual player pages with various image states

## Files Modified During Failed Implementation

1. `/backend/src/services/playerImageService.ts` - Added medium3x, smart generation, ES module fixes
2. `/frontend/src/hooks/useResponsiveImage.ts` - Added useProcessedUrl flag and logic
3. `/frontend/src/components/PlayerImage.tsx` - Extended imageInfo interface and priority logic  
4. `/frontend/src/pages/PlayerDetail.tsx` - Added image metadata fetching

All changes were reverted due to implementation issues.

## Key Learnings

1. **ES Module Compatibility**: Always use proper ES module imports in TypeScript backend
2. **Complex State Management**: Multiple interdependent components can create unpredictable behavior
3. **Testing is Critical**: Without proper testing, complex image loading logic is prone to subtle bugs
4. **Incremental Implementation**: Large feature additions should be broken into smaller, testable pieces

## Next Steps for Future Implementation

1. **Start Small**: Begin with basic processed image display without responsive variants
2. **Test Early**: Set up proper testing infrastructure before implementing complex logic  
3. **Document Everything**: Add extensive logging and documentation throughout the process
4. **User Testing**: Test on actual player pages immediately after each change