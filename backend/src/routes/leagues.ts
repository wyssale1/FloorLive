import { Router } from 'express';
import { SwissUnihockeyApiClient } from '../services/swissUnihockeyApi.js';
import { CacheService } from '../services/cacheService.js';
import {
  TOP_TIER_LEAGUES,
  LOWER_TIER_LEAGUES,
  getLowerTierLeagueGroups,
  LeagueConfig,
} from '../config/leagues-config.js';

const router = Router();
const apiClient = new SwissUnihockeyApiClient();
const cache = new CacheService();

// GET /api/leagues/config - Get league configuration for lazy loading
router.get('/config', (req, res) => {
  try {
    const topTier = TOP_TIER_LEAGUES.map((league) => ({
      id: league.id,
      gameClass: league.gameClass,
      name: league.name,
      displayName: league.displayName,
      groups: league.groups,
      priority: league.priority,
      defaultExpanded: league.defaultExpanded,
    }));

    const lowerTier = getLowerTierLeagueGroups().map((item) => ({
      id: item.league.id,
      gameClass: item.league.gameClass,
      name: item.league.name,
      displayName: item.displayName,
      group: item.group,
      priority: item.league.priority,
      defaultExpanded: item.league.defaultExpanded,
    }));

    res.json({
      topTier,
      lowerTier,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting league config:', error);
    res.status(500).json({
      error: 'Failed to get league configuration',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

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

      const rankingsResult = await apiClient.getRankings(params);

      if (!rankingsResult) {
        return res.status(404).json({ error: 'League table not found' });
      }

      // Transform new rankings format to old table format for backward compatibility
      table = rankingsResult.standings || {
        standings: [],
        leagueId: leagueId,
        leagueName: 'Unknown League'
      };

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
    const { season, league, game_class, group, leagueName, teamNames } = req.query;

    // Build cache key from all parameters including leagueName for gender differentiation
    const cacheKey = `rankings:${season || 'current'}:${league || 'default'}:${game_class || 'default'}:${group || 'default'}:${leagueName || 'default'}`;
    let rankings = cache.get(cacheKey);

    if (!rankings) {
      const params: any = {};
      if (season) params.season = season.toString();
      if (league) params.league = league.toString();
      if (game_class) params.game_class = game_class.toString();
      if (group) params.group = group.toString();
      if (leagueName) params.leagueName = leagueName.toString();
      if (teamNames) {
        // Handle both single string and array cases
        params.teamNames = Array.isArray(teamNames) ? teamNames.map(name => name.toString()) : [teamNames.toString()];
      }

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