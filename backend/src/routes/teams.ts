import { Router } from 'express';
import { SwissUnihockeyApiClient } from '../services/swissUnihockeyApi.js';
import { CacheService } from '../services/cacheService.js';
import { entityMasterService } from '../services/entityMasterService.js';
import { backgroundEntityService } from '../services/backgroundEntityService.js';
import { EntityTtlHelper } from '../utils/entityTtlHelper.js';
import { assetService } from '../services/assetService.js';

const router = Router();
const apiClient = new SwissUnihockeyApiClient();
const cache = new CacheService();


// GET /api/teams/search?q=query - Search teams (must be before /:teamId route)
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

    // Search using the master registry
    const teams = await entityMasterService.searchTeams(q.trim(), limitClamped);

    // Format results for frontend
    const results = teams.map(team => ({
      id: team.id,
      name: team.name,
      league: team.league || 'Swiss Unihockey'
    }));

    res.json({
      query: q.trim(),
      limit: limitClamped,
      totalResults: results.length,
      teams: results
    });

  } catch (error) {
    console.error('Error searching teams:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to search teams'
    });
  }
});

// GET /api/teams/:teamId - Get team details
router.get('/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;

    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    // Check API cache first for immediate response
    const cacheKey = `team:${teamId}`;
    let team = cache.get(cacheKey);

    if (!team) {
      team = await apiClient.getTeamDetails(teamId);

      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      // Cache team details for 1 hour (they don't change frequently)
      cache.set(cacheKey, team, 3600000);
    }

    // Check TTL and schedule refresh if needed (unified logic)
    const teamName = (team as any).name || `Team ${teamId}`;
    const ttlResult = await EntityTtlHelper.checkAndScheduleTeamRefresh(teamId, teamName);

    // Only log when refresh is actually needed (optional - for debugging)
    if (ttlResult.shouldRefresh) {
      if (ttlResult.isNewEntity) {
        console.log(`🆕 New team discovered: ${teamName} (${teamId})`);
      } else {
        console.log(`🔄 Team ${teamName} (${teamId}) TTL expired - scheduled refresh`);
      }
    }

    res.json(team);

  } catch (error) {
    console.error('Error fetching team details:', error);
    res.status(500).json({
      error: 'Failed to fetch team details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/teams/:teamId/players - Get team players/roster
router.get('/:teamId/players', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    const cacheKey = `team:${teamId}:players`;
    let players = cache.get(cacheKey);
    
    if (!players) {
      players = await apiClient.getTeamPlayers(teamId);
      
      // Cache players for 6 hours (roster doesn't change very often)
      cache.set(cacheKey, players, 21600000);
    }

    // Process players: add to master registry and check for updates
    try {
      // Get team name for player entities
      let teamName = `Team ${teamId}`;
      try {
        const teamCacheKey = `team:${teamId}`;
        let teamDetails = cache.get(teamCacheKey);
        if (!teamDetails) {
          teamDetails = await apiClient.getTeamDetails(teamId);
          if (teamDetails) {
            cache.set(teamCacheKey, teamDetails, 3600000);
          }
        }
        if (teamDetails && (teamDetails as any).name) {
          teamName = (teamDetails as any).name;
        }
      } catch (error) {
        console.warn('Could not get team name, using default');
      }

      // Process players for TTL checking (entity registry updates)
      for (const player of (players as any[])) {
        if (player.id) {
          const playerName = player.name || `Player ${player.id}`;

          // Check TTL and schedule refresh if needed (unified logic)
          await EntityTtlHelper.checkAndSchedulePlayerRefresh(
            player.id,
            playerName,
            teamName,
            teamId
          );
        }
      }
    } catch (error) {
      // Don't fail the request if TTL processing fails
      console.error('Error processing players TTL for team:', teamId, error);
    }

    // Check for duplicate jersey numbers (debug logging)
    const numberCounts = new Map();
    (players as any[]).forEach(player => {
      if (player.number) {
        const count = numberCounts.get(player.number) || 0;
        numberCounts.set(player.number, count + 1);
      }
    });
    
    // Log any duplicate numbers
    for (const [number, count] of numberCounts.entries()) {
      if (count > 1) {
        console.warn(`⚠️  Duplicate jersey number ${number} found ${count} times in team ${teamId}`);
        const duplicatePlayers = (players as any[]).filter(p => p.number === number);
        duplicatePlayers.forEach(p => console.warn(`   - Player: ${p.name} (ID: ${p.id})`));
      }
    }

    // Add hasProcessedImages property to each player for frontend optimization
    const enhancedPlayers = (players as any[]).map(player => ({
      ...player,
      hasProcessedImages: assetService.hasPlayerDirectory(player.id)
    }));

    res.json({
      teamId,
      players: enhancedPlayers,
      count: enhancedPlayers.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching team players:', error);
    res.status(500).json({
      error: 'Failed to fetch team players',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/teams/:teamId/statistics - Get team statistics
router.get('/:teamId/statistics', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    const cacheKey = `team:${teamId}:statistics`;
    let statistics = cache.get(cacheKey);
    
    if (!statistics) {
      statistics = await apiClient.getTeamStatistics(teamId);
      
      if (!statistics) {
        return res.status(404).json({ error: 'Team statistics not found' });
      }

      // Cache statistics for 24 hours (historical data doesn't change)
      cache.set(cacheKey, statistics, 86400000);
    }

    res.json({
      teamId,
      statistics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching team statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch team statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/teams/:teamId/competitions - Get team competitions
router.get('/:teamId/competitions', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    const cacheKey = `team:${teamId}:competitions`;
    let competitions = cache.get(cacheKey);
    
    if (!competitions) {
      competitions = await apiClient.getTeamCompetitions(teamId);
      
      // Cache competitions for 6 hours (they don't change often)
      cache.set(cacheKey, competitions, 21600000);
    }

    res.json({
      teamId,
      competitions,
      count: (competitions as any[]).length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching team competitions:', error);
    res.status(500).json({
      error: 'Failed to fetch team competitions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/teams/:teamId/games - Get team games (all games for current season)
router.get('/:teamId/games', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { season } = req.query;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    // Create cache key that includes season parameter
    const cacheKey = `team:${teamId}:games:${season || 'current'}`;
    let games = cache.get(cacheKey);
    
    if (!games) {
      games = await apiClient.getTeamGames(teamId, season as string);
      
      // Cache games for 30 minutes (they can change with schedule updates)
      cache.set(cacheKey, games, 1800000);
    }

    res.json({
      teamId,
      season: season || 'current',
      games,
      count: (games as any[]).length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching team games:', error);
    res.status(500).json({
      error: 'Failed to fetch team games',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;