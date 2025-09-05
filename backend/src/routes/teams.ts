import { Router } from 'express';
import { SwissUnihockeyApiClient } from '../services/swissUnihockeyApi.js';
import { CacheService } from '../services/cacheService.js';

const router = Router();
const apiClient = new SwissUnihockeyApiClient();
const cache = new CacheService();

// GET /api/teams/:teamId - Get team details
router.get('/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    // Check cache first
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

    res.json({
      teamId,
      players,
      count: (players as any[]).length,
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

// GET /api/teams/:teamId/games - Get team upcoming games
router.get('/:teamId/games', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    const cacheKey = `team:${teamId}:games`;
    let games = cache.get(cacheKey);
    
    if (!games) {
      games = await apiClient.getTeamUpcomingGames(teamId);
      
      // Cache upcoming games for 30 minutes (they can change with schedule updates)
      cache.set(cacheKey, games, 1800000);
    }

    res.json({
      teamId,
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