import { Router } from 'express';
import { SwissUnihockeyApiClient } from '../services/swissUnihockeyApi.js';
import { CacheService } from '../services/cacheService.js';
import { assetService } from '../services/assetService.js';
import { entityMasterService } from '../services/entityMasterService.js';
import { backgroundEntityService } from '../services/backgroundEntityService.js';
import { EntityTtlHelper } from '../utils/entityTtlHelper.js';

const router = Router();
const apiClient = new SwissUnihockeyApiClient();
const cache = new CacheService();

// GET /api/players/search?q=query - Search players (must be before /:playerId route)
router.get('/search', async (req, res) => {
  try {
    const { q, limit } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        error: 'Search query is required',
        message: 'Please provide a search query using the "q" parameter'
      });
    }

    if (q.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query too short',
        message: 'Please provide at least 2 characters to search'
      });
    }

    const searchLimit = limit && typeof limit === 'string' ? parseInt(limit, 10) : 20;
    const limitClamped = Math.min(Math.max(searchLimit, 1), 100); // Between 1 and 100

    // Search using the master registry (guaranteed data with image processing lifecycle)
    const players = await entityMasterService.searchPlayers(q.trim(), limitClamped);

    // Format results with actual availability checks
    // URLs are guaranteed to work via fallback middleware, but we check actual availability for UI
    const finalResults = await Promise.all(players.map(async player => {
      const hasImage = await assetService.hasPlayerImage(player.id);
      return {
        id: player.id,
        name: player.name,
        teamName: player.team,
        teamId: player.teamId,
        hasImage,
        imageUrl: `/assets/players/player-${player.id}/${player.id}_small.webp`,
        imagePaths: {
          small: `/assets/players/player-${player.id}/${player.id}_small.webp`,
          medium: `/assets/players/player-${player.id}/${player.id}_medium.webp`
        },
        source: 'master'
      };
    }));


    res.json({
      query: q.trim(),
      results: finalResults,
      count: finalResults.length,
      limit: limitClamped,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error searching players:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/players/:playerId - Get player details
router.get('/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;

    if (!playerId) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    // Check API cache first for immediate response
    const cacheKey = `player:${playerId}`;
    let player = cache.get(cacheKey);

    if (!player) {
      player = await apiClient.getPlayerDetails(playerId);

      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }

      // Cache player details for 1 hour (they don't change frequently)
      cache.set(cacheKey, player, 3600000);
    }

    // Check TTL and schedule refresh if needed (unified logic)
    const playerName = (player as any)?.name || `Player ${playerId}`;

    // Extract team information for TTL helper
    let teamName: string | undefined;
    let teamId: string | undefined;

    if ((player as any).club) {
      teamName = (player as any).club.name;
      teamId = (player as any).club.id;
    } else if ((player as any).currentSeason) {
      teamName = (player as any).currentSeason.team;
    }

    const ttlResult = await EntityTtlHelper.checkAndSchedulePlayerRefresh(playerId, playerName, teamName, teamId);

    // Only log when refresh is actually needed (optional - for debugging)
    if (ttlResult.shouldRefresh) {
      if (ttlResult.isNewEntity) {
        console.log(`🆕 New player discovered: ${playerName} (${playerId})`);
      } else {
        console.log(`🔄 Player ${playerName} (${playerId}) TTL expired - scheduled refresh`);
      }
    }

    res.json({ player });

  } catch (error) {
    console.error('Error fetching player details:', error);
    res.status(500).json({
      error: 'Failed to fetch player details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/players/:playerId/statistics - Get player statistics
router.get('/:playerId/statistics', async (req, res) => {
  try {
    const { playerId } = req.params;
    
    if (!playerId) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    // Check cache first (cache for 30 minutes)
    const cacheKey = `player:${playerId}:statistics`;
    let statistics = cache.get(cacheKey);
    
    if (!statistics) {
      statistics = await apiClient.getPlayerStatistics(playerId);
      
      // Cache statistics for 30 minutes (may change more frequently)
      cache.set(cacheKey, statistics, 1800000);
    }

    res.json({ statistics });

  } catch (error) {
    console.error('Error fetching player statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch player statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/players/:playerId/overview - Get player game overview
router.get('/:playerId/overview', async (req, res) => {
  try {
    const { playerId } = req.params;
    
    if (!playerId) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    // Check cache first (cache for 30 minutes)
    const cacheKey = `player:${playerId}:overview`;
    let overview = cache.get(cacheKey);
    
    if (!overview) {
      overview = await apiClient.getPlayerOverview(playerId);
      
      // Cache overview for 30 minutes
      cache.set(cacheKey, overview, 1800000);
    }

    res.json({ overview });

  } catch (error) {
    console.error('Error fetching player overview:', error);
    res.status(500).json({
      error: 'Failed to fetch player overview',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/players/:playerId/images - Get player image paths
router.get('/:playerId/images', async (req, res) => {
  try {
    const { playerId } = req.params;
    
    if (!playerId) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    const hasImage = await assetService.hasPlayerImage(playerId);

    if (!hasImage) {
      return res.status(404).json({
        error: 'Player images not found',
        message: `No processed images available for player ${playerId}`,
        hasImage: false
      });
    }

    const imageUrls = assetService.getPlayerImageUrls(playerId);

    res.json({
      playerId,
      hasImage: true,
      imageUrls,
      metadata: {
        processedAt: new Date().toISOString(),
        formats: ['avif', 'webp', 'png'],
        sizes: ['small', 'medium', 'large']
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching player images:', error);
    res.status(500).json({
      error: 'Failed to fetch player images',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/players/stats/cache - Get cache statistics (for debugging/monitoring)
router.get('/stats/cache', async (req, res) => {
  try {
    // Since we moved to build-time processing, return basic stats
    const stats = {
      message: 'Player images are now processed at build-time via local script',
      buildTimeProcessing: true,
      assetsLocation: '/assets/players/',
      processingScript: 'scripts/image-processor.js'
    };

    res.json({
      ...stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({
      error: 'Failed to fetch cache stats',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;