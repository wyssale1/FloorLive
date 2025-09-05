import { Router } from 'express';
import { SwissUnihockeyApiClient } from '../services/swissUnihockeyApi.js';
import { CacheService } from '../services/cacheService.js';

const router = Router();
const apiClient = new SwissUnihockeyApiClient();
const cache = new CacheService();

// GET /api/leagues/:leagueId/table - Get league table/standings (deprecated - use /rankings instead)
router.get('/:leagueId/table', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const { season } = req.query;
    
    if (!leagueId) {
      return res.status(400).json({ error: 'League ID is required' });
    }

    const cacheKey = `league:${leagueId}:table:${season || 'current'}`;
    let table = cache.get(cacheKey);
    
    if (!table) {
      // Use getRankings instead of deprecated getLeagueTable
      const params: any = { league: leagueId };
      if (season) params.season = season.toString();
      
      table = await apiClient.getRankings(params);
      
      if (!table) {
        return res.status(404).json({ error: 'League table not found' });
      }

      // Cache league table for 30 minutes (standings can change after games)
      cache.set(cacheKey, table, 1800000);
    }

    res.json({
      leagueId,
      table,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching league table:', error);
    res.status(500).json({
      error: 'Failed to fetch league table',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/leagues/rankings - Get league rankings/standings
router.get('/rankings', async (req, res) => {
  try {
    const { season, league, game_class, group } = req.query;
    
    // Build cache key from all parameters
    const cacheKey = `rankings:${season || 'current'}:${league || 'default'}:${game_class || 'default'}:${group || 'default'}`;
    let rankings = cache.get(cacheKey);
    
    if (!rankings) {
      const params: any = {};
      if (season) params.season = season.toString();
      if (league) params.league = league.toString();
      if (game_class) params.game_class = game_class.toString();
      if (group) params.group = group.toString();
      
      rankings = await apiClient.getRankings(params);
      
      if (!rankings) {
        return res.status(404).json({ error: 'Rankings not found' });
      }

      // Cache rankings for 30 minutes (standings can change after games)
      cache.set(cacheKey, rankings, 1800000);
    }

    res.json({
      rankings,
      timestamp: new Date().toISOString(),
      cached: cache.has(cacheKey)
    });

  } catch (error) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({
      error: 'Failed to fetch rankings',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;