import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Middleware that provides fallback behavior for missing asset files
 * Ensures hardcoded asset URLs always return valid images
 */
export function assetFallbackMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Only handle player asset requests
  if (!req.path.startsWith('/assets/players/')) {
    return next();
  }

  const assetsPath = path.join(__dirname, '..', '..', 'assets', 'players');
  const requestedFile = req.path.replace('/assets/players/', '');
  const fullPath = path.join(assetsPath, requestedFile);

  // Check if requested file exists
  if (fs.existsSync(fullPath)) {
    return next(); // File exists, let static middleware handle it
  }

  // Handle fallback logic for missing files
  const pathParts = requestedFile.split('/');
  if (pathParts.length === 2) {
    const playerId = pathParts[0];
    const fileName = pathParts[1];
    const playerDir = path.join(assetsPath, playerId);

    // Check if player directory exists
    if (!fs.existsSync(playerDir)) {
      return serveGenericPlaceholder(res, fileName);
    }

    // Handle specific fallback mappings
    let fallbackFile: string | null = null;

    if (fileName === 'profile.webp') {
      // profile.webp -> try medium, then small webp
      const mediumPath = path.join(playerDir, `${playerId}_medium.webp`);
      const smallPath = path.join(playerDir, `${playerId}_small.webp`);

      if (fs.existsSync(mediumPath)) {
        fallbackFile = mediumPath;
      } else if (fs.existsSync(smallPath)) {
        fallbackFile = smallPath;
      }
    } else if (fileName.endsWith('_small.webp')) {
      // Try exact match, then other formats
      const baseName = fileName.replace('.webp', '');
      const avifPath = path.join(playerDir, `${baseName}.avif`);
      const pngPath = path.join(playerDir, `${baseName}.png`);

      if (fs.existsSync(avifPath)) {
        fallbackFile = avifPath;
      } else if (fs.existsSync(pngPath)) {
        fallbackFile = pngPath;
      }
    } else if (fileName.endsWith('_medium.webp')) {
      // Try exact match, then other formats
      const baseName = fileName.replace('.webp', '');
      const avifPath = path.join(playerDir, `${baseName}.avif`);
      const pngPath = path.join(playerDir, `${baseName}.png`);

      if (fs.existsSync(avifPath)) {
        fallbackFile = avifPath;
      } else if (fs.existsSync(pngPath)) {
        fallbackFile = pngPath;
      }
    }

    // If we found a fallback file, serve it
    if (fallbackFile) {
      return res.sendFile(fallbackFile);
    }

    // No processed images found - serve generic placeholder
    return serveGenericPlaceholder(res, fileName);
  }

  // Fallback to next middleware if path structure is unexpected
  next();
}

/**
 * Serves a generic placeholder image when no processed images are available
 */
function serveGenericPlaceholder(res: Response, fileName: string): void {
  // Set appropriate content type based on requested format
  const contentType = getContentType(fileName);
  res.set('Content-Type', contentType);
  res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

  // For now, send a 1x1 transparent pixel as placeholder
  // This could be enhanced to generate actual placeholder images
  const transparentPixel = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
    0x0B, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);

  res.send(transparentPixel);
}

/**
 * Gets appropriate content type based on file extension
 */
function getContentType(fileName: string): string {
  if (fileName.endsWith('.webp')) {
    return 'image/webp';
  } else if (fileName.endsWith('.avif')) {
    return 'image/avif';
  } else if (fileName.endsWith('.png')) {
    return 'image/png';
  } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  return 'image/webp'; // Default fallback
}