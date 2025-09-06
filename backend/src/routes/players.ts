import { Router } from 'express';
import { SwissUnihockeyApiClient } from '../services/swissUnihockeyApi.js';
import { CacheService } from '../services/cacheService.js';

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

export default router;