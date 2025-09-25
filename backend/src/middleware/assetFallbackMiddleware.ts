import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Middleware that provides format fallback behavior for missing asset files
 * Only handles format fallbacks - express.static handles missing files with natural 404s
 */
export function assetFallbackMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Only handle player asset requests that weren't served by static middleware
  if (!req.path.startsWith('/assets/players/')) {
    return next();
  }

  const assetsPath = path.join(__dirname, '..', '..', 'assets', 'players');
  const requestedFile = req.path.replace('/assets/players/', '');

  // Handle fallback logic for missing files (only called if static middleware didn't serve it)
  const pathParts = requestedFile.split('/');
  if (pathParts.length === 2) {
    const playerId = pathParts[0];
    const fileName = pathParts[1];
    const playerDir = path.join(assetsPath, playerId);

    // Only provide format fallbacks for existing player directories
    if (!fs.existsSync(playerDir)) {
      return next(); // Let it naturally 404
    }

    // Handle specific format fallback mappings
    let fallbackFile: string | null = null;

    if (fileName === 'profile.webp') {
      // profile.webp -> try medium, then small webp
      const mediumPath = path.join(playerDir, `${playerId.replace('player-', '')}_medium.webp`);
      const smallPath = path.join(playerDir, `${playerId.replace('player-', '')}_small.webp`);

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
  }

  // No format fallbacks available - let it naturally 404
  next();
}

