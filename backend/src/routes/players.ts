import { Router } from 'express';
import { SwissUnihockeyApiClient } from '../services/swissUnihockeyApi.js';
import { CacheService } from '../services/cacheService.js';
import { playerImageService } from '../services/playerImageService.js';

const router = Router();
const apiClient = new SwissUnihockeyApiClient();
const cache = new CacheService();

// GET /api/players/:playerId - Get player details
router.get('/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    
    if (!playerId) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    // Check cache first (cache for 1 hour)
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

// GET /api/players/search?q=query - Search players
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

    // Search using the player image service's search index
    const results = playerImageService.searchPlayers(q.trim(), limitClamped);

    // Enrich results with image paths for players that have processed images
    const enrichedResults = results.map(player => ({
      id: player.id,
      name: player.name,
      teamName: player.teamName,
      teamId: player.teamId,
      hasImage: player.hasImage,
      imagePaths: player.hasImage ? playerImageService.getPlayerImagePaths(player.id) : null
    }));

    res.json({
      query: q.trim(),
      results: enrichedResults,
      count: enrichedResults.length,
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