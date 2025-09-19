import { Router } from 'express';
import { SwissUnihockeyApiClient } from '../services/swissUnihockeyApi.js';
import { CacheService } from '../services/cacheService.js';
import { playerImageService } from '../services/playerImageService.js';
import { entityMasterService } from '../services/entityMasterService.js';
import { backgroundEntityService } from '../services/backgroundEntityService.js';

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

    // Search using the master registry (faster and more comprehensive)
    const masterResults = await entityMasterService.searchPlayers(q.trim(), limitClamped);

    // Also search using the legacy player image service for fallback
    const legacyResults = playerImageService.searchPlayers(q.trim(), limitClamped);

    // Merge results, prioritizing master registry
    const resultMap = new Map();

    // Add master registry results first
    for (const player of masterResults) {
      resultMap.set(player.id, {
        id: player.id,
        name: player.name,
        teamName: player.team,
        teamId: player.teamId,
        hasImage: false, // Will be updated below
        imagePaths: null, // Will be updated below
        source: 'master'
      });
    }

    // Enrich with legacy results and image data
    for (const legacyPlayer of legacyResults) {
      const existing = resultMap.get(legacyPlayer.id);
      if (existing) {
        // Update existing entry with image info
        existing.hasImage = legacyPlayer.hasImage;
        existing.imagePaths = legacyPlayer.hasImage ? playerImageService.getPlayerImagePaths(legacyPlayer.id) : null;
      } else if (resultMap.size < limitClamped) {
        // Add legacy result if space available
        resultMap.set(legacyPlayer.id, {
          id: legacyPlayer.id,
          name: legacyPlayer.name,
          teamName: legacyPlayer.teamName,
          teamId: legacyPlayer.teamId,
          hasImage: legacyPlayer.hasImage,
          imagePaths: legacyPlayer.hasImage ? playerImageService.getPlayerImagePaths(legacyPlayer.id) : null,
          source: 'legacy'
        });
      }
    }

    const finalResults = Array.from(resultMap.values()).slice(0, limitClamped);

    res.json({
      query: q.trim(),
      results: finalResults,
      count: finalResults.length,
      limit: limitClamped,
      sources: {
        master: masterResults.length,
        legacy: legacyResults.length,
        merged: finalResults.length
      },
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

    // Check master registry for player entity (background refresh logic)
    const playerEntity = await entityMasterService.getPlayer(playerId);
    let shouldRefresh = false;

    if (!playerEntity) {
      // New player - mark for refresh
      shouldRefresh = true;
      console.log(`🆕 New player discovered: ${playerId}`);
    } else {
      // Check if player needs refresh based on TTL
      const ttlDate = new Date(playerEntity.ttl);
      if (new Date() > ttlDate) {
        shouldRefresh = true;
        console.log(`🕐 Player ${playerId} (${playerEntity.name}) needs refresh`);
      }
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

    // Schedule background refresh if needed (non-blocking)
    if (shouldRefresh) {
      const playerName = (player as any).name || `Player ${playerId}`;

      // Extract team information for master registry
      let teamName: string | undefined;
      let teamId: string | undefined;

      if ((player as any).club) {
        teamName = (player as any).club.name;
        teamId = (player as any).club.id;
      } else if ((player as any).currentSeason) {
        teamName = (player as any).currentSeason.team;
      }

      // Add stub to master registry if new (minimal data only)
      if (!playerEntity) {
        await entityMasterService.addPlayerStub(playerId, playerName, teamName, teamId);
        console.log(`🆕 New player discovered: ${playerName} (${playerId}) - added stub to registry`);
      } else {
        console.log(`🕐 Player ${playerName} (${playerId}) TTL expired - scheduling background refresh`);
      }

      // Schedule background refresh (this is where the full API update happens)
      backgroundEntityService.scheduleEntityRefresh(playerId, 'player', playerName, 'normal')
        .catch(error => {
          console.error(`❌ Failed to schedule player refresh for ${playerId}:`, error);
        });
    } else if (playerEntity) {
      console.log(`✅ Player ${playerEntity.name} (${playerId}) TTL valid - no refresh needed`);
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

    const imagePaths = playerImageService.getPlayerImagePaths(playerId);
    const metadata = playerImageService.getPlayerMetadata(playerId);

    if (!imagePaths || !metadata) {
      return res.status(404).json({
        error: 'Player images not found',
        message: `No processed images available for player ${playerId}`,
        hasImage: false
      });
    }

    res.json({
      playerId,
      hasImage: metadata.hasImage,
      imagePaths,
      metadata: {
        processedAt: metadata.processedAt,
        lastUpdated: metadata.lastUpdated,
        formats: metadata.formats,
        sizes: Object.keys(metadata.sizes)
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
    const stats = playerImageService.getCacheStats();
    
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