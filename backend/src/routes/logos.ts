import { Router } from 'express';
import { logoService } from '../services/logoService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

/**
 * Smart logo serving with format negotiation
 * Serves the best available format based on browser support
 */
router.get('/team-:teamId/:size.:format', asyncHandler(async (req, res) => {
  const { teamId, size, format } = req.params;
  
  // Validate parameters
  if (!['large', 'small'].includes(size)) {
    return res.status(400).json({ error: 'Invalid size. Must be "large" or "small"' });
  }
  
  if (!['avif', 'webp', 'png'].includes(format)) {
    return res.status(400).json({ error: 'Invalid format. Must be "avif", "webp", or "png"' });
  }

  try {
    // Get logo file path
    const logoPath = await logoService.getLogoPath(teamId, size as 'large' | 'small', format);
    
    if (!logoPath) {
      return res.status(404).json({ 
        error: 'Logo not found',
        message: `Logo for team ${teamId} in ${size} ${format} format not available`
      });
    }

    // Set appropriate headers for caching
    const maxAge = 30 * 24 * 60 * 60; // 30 days
    res.set({
      'Cache-Control': `public, max-age=${maxAge}, immutable`,
      'Content-Type': `image/${format}`,
      'X-Logo-Team': teamId,
      'X-Logo-Size': size,
      'X-Logo-Format': format
    });

    // Serve the file
    res.sendFile(logoPath);
    
  } catch (error) {
    console.error(`Error serving logo for team ${teamId}:`, error);
    res.status(500).json({ 
      error: 'Failed to serve logo',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * Get available logo formats for a team
 * Returns URLs for all available formats and sizes
 */
router.get('/team-:teamId/info', asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  
  try {
    const hasLogo = await logoService.hasValidLogo(teamId);
    const logoUrls = logoService.getLogoUrls(teamId);
    
    res.json({
      teamId,
      available: hasLogo,
      urls: hasLogo ? logoUrls : null,
      formats: ['avif', 'webp', 'png'],
      sizes: {
        large: { width: 200, height: 200 },
        small: { width: 32, height: 32 }
      }
    });
    
  } catch (error) {
    console.error(`Error getting logo info for team ${teamId}:`, error);
    res.status(500).json({
      error: 'Failed to get logo info',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * Get logo cache statistics (for debugging/monitoring)
 */
router.get('/cache/stats', asyncHandler(async (req, res) => {
  try {
    const stats = logoService.getCacheStats();
    res.json({
      cache: stats,
      timestamp: new Date().toISOString(),
      config: {
        cacheDirectory: 'backend/assets/logos',
        cacheDurationDays: 30,
        supportedFormats: ['avif', 'webp', 'png'],
        supportedSizes: ['large', 'small']
      }
    });
  } catch (error) {
    console.error('Error getting logo cache stats:', error);
    res.status(500).json({
      error: 'Failed to get cache stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * Preferred format endpoint - automatically serves best format based on Accept header
 */
router.get('/team-:teamId/:size', asyncHandler(async (req, res) => {
  const { teamId, size } = req.params;
  const acceptHeader = req.get('Accept') || '';
  
  // Determine best format based on browser support
  let preferredFormat = 'png'; // fallback
  
  if (acceptHeader.includes('image/avif')) {
    preferredFormat = 'avif';
  } else if (acceptHeader.includes('image/webp')) {
    preferredFormat = 'webp';
  }
  
  // Check if preferred format exists, fallback to others if not
  const formats = ['avif', 'webp', 'png'];
  const startIndex = formats.indexOf(preferredFormat);
  const orderedFormats = [
    ...formats.slice(startIndex),
    ...formats.slice(0, startIndex)
  ];
  
  for (const format of orderedFormats) {
    const logoPath = await logoService.getLogoPath(teamId, size as 'large' | 'small', format);
    if (logoPath) {
      // Set appropriate headers
      const maxAge = 30 * 24 * 60 * 60; // 30 days
      res.set({
        'Cache-Control': `public, max-age=${maxAge}, immutable`,
        'Content-Type': `image/${format}`,
        'X-Logo-Team': teamId,
        'X-Logo-Size': size,
        'X-Logo-Format': format,
        'X-Logo-Negotiated': 'true'
      });
      
      return res.sendFile(logoPath);
    }
  }
  
  // No logo available
  res.status(404).json({
    error: 'Logo not found',
    message: `No logo available for team ${teamId} in ${size} size`
  });
}));

/**
 * Manual testing endpoint for debugging logo processing
 * POST /api/logos/test with { teamId: string, logoUrl: string }
 */
router.post('/test', asyncHandler(async (req, res) => {
  const { teamId, logoUrl } = req.body;
  
  if (!teamId || !logoUrl) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['teamId', 'logoUrl'],
      received: req.body
    });
  }

  try {
    console.log(`[LOGO TEST] Manual processing request for team ${teamId} with URL: ${logoUrl}`);
    
    // Trigger logo processing
    await logoService.processTeamLogoBackground(teamId, logoUrl);
    
    // Return immediate response
    res.json({
      message: 'Logo processing started in background',
      teamId,
      logoUrl,
      timestamp: new Date().toISOString(),
      note: 'Check server logs for processing status'
    });
    
  } catch (error) {
    console.error(`[LOGO TEST] Error in manual processing:`, error);
    res.status(500).json({
      error: 'Failed to start logo processing',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

/**
 * Debug endpoint to check current state
 */
router.get('/debug', asyncHandler(async (req, res) => {
  try {
    const stats = logoService.getCacheStats();
    
    res.json({
      service: 'Logo Service Debug',
      timestamp: new Date().toISOString(),
      cache: stats,
      endpoints: {
        test: 'POST /api/logos/test - Manual logo processing',
        info: 'GET /api/logos/team-{id}/info - Team logo info',
        serve: 'GET /api/logos/team-{id}/{size}.{format} - Serve logo',
        stats: 'GET /api/logos/cache/stats - Cache statistics'
      },
      supportedFormats: ['avif', 'webp', 'png'],
      supportedSizes: ['large', 'small']
    });
    
  } catch (error) {
    console.error('[LOGO DEBUG] Error getting debug info:', error);
    res.status(500).json({
      error: 'Failed to get debug info',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

export default router;