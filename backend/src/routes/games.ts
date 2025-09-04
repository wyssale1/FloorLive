import { Router } from 'express';
import { format, parseISO, isValid } from 'date-fns';
import { SwissUnihockeyApiClient } from '../services/swissUnihockeyApi.js';
import { CacheService } from '../services/cacheService.js';
import { sortLeagues } from '../shared/utils/teamMapping.js';
import { enrichGameWithLogos } from '../middleware/logoCache.js';
import { addOptimisticLogosToGames } from '../utils/logoEnrichment.js';

const router = Router();
const apiClient = new SwissUnihockeyApiClient();
const cache = new CacheService();

// GET /api/games?date=2024-09-03
router.get('/', async (req, res) => {
  try {
    const dateParam = req.query.date as string;
    
    // Default to today if no date provided
    const targetDate = dateParam 
      ? parseISO(dateParam) 
      : new Date();

    if (!isValid(targetDate)) {
      return res.status(400).json({
        error: 'Invalid date format. Use YYYY-MM-DD format.'
      });
    }

    const dateString = format(targetDate, 'yyyy-MM-dd');

    // Check cache first
    let games = cache.getGames(dateString);
    let fromCache = false;
    
    if (games === null) {
      console.log(`Fetching games for ${dateString} from API...`);
      try {
        games = await apiClient.getGamesByDate(dateString);
        // Always cache the result, even if empty
        cache.setGames(dateString, games);
        console.log(`Cached ${games.length} games for ${dateString}`);
      } catch (error) {
        console.error(`Failed to fetch games for ${dateString}:`, error);
        games = []; // Return empty array on error
      }
    } else {
      console.log(`Serving cached games for ${dateString} (${games.length} games)`);
      fromCache = true;
    }

    // Group by league for frontend
    const gamesByLeague = games.reduce((acc, game) => {
      let leagueName = game.league.name;
      
      // Handle games without proper league information
      if (!leagueName || leagueName === 'Unknown League' || leagueName.trim() === '') {
        leagueName = 'Other Leagues';
      }
      
      if (!acc[leagueName]) {
        acc[leagueName] = [];
      }
      acc[leagueName].push(game);
      return acc;
    }, {} as Record<string, typeof games>);

    const leagueNames = Object.keys(gamesByLeague);
    const orderedLeagues = sortLeagues(leagueNames);

    // Add optimistic logo URLs to all games (fast, sync operation)
    addOptimisticLogosToGames(games);

    res.json({
      date: dateString,
      leagues: orderedLeagues,
      gamesByLeague,
      totalGames: games.length,
      cached: fromCache,
      hasGames: games.length > 0
    });

  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({
      error: 'Failed to fetch games',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/games/live - Get currently live games
router.get('/live', async (req, res) => {
  try {
    let liveGames = cache.getLiveGames();
    
    if (!liveGames) {
      console.log('Fetching live games from API...');
      liveGames = await apiClient.getCurrentGames();
      // Only cache if there are actual live games
      if (liveGames.length > 0) {
        cache.setLiveGames(liveGames);
      }
    } else {
      console.log('Serving cached live games');
    }

    // Add optimistic logo URLs to live games
    addOptimisticLogosToGames(liveGames);

    res.json({
      games: liveGames,
      count: liveGames.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching live games:', error);
    res.status(500).json({
      error: 'Failed to fetch live games',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/games/:gameId - Get game details
router.get('/:gameId', enrichGameWithLogos, async (req, res) => {
  try {
    const { gameId } = req.params;
    
    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }

    // Check cache first
    const cacheKey = `game:${gameId}`;
    let game = cache.get(cacheKey);
    
    if (!game) {
      console.log(`Fetching game ${gameId} from API...`);
      game = await apiClient.getGameDetails(gameId);
      
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      // Cache for shorter time if live, longer if finished
      const ttl = (game as any)?.status === 'live' ? 30000 : 3600000; // 30s vs 1h
      cache.set(cacheKey, game, ttl);
    } else {
      console.log(`Serving cached game ${gameId}`);
    }

    res.json(game);

  } catch (error) {
    console.error('Error fetching game details:', error);
    res.status(500).json({
      error: 'Failed to fetch game details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/games/:gameId/events - Get game events/timeline
router.get('/:gameId/events', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }

    const cacheKey = `events:${gameId}`;
    let events = cache.get(cacheKey);
    
    if (!events) {
      console.log(`Fetching events for game ${gameId} from API...`);
      events = await apiClient.getGameEvents(gameId);
      
      // Cache events for 30 seconds (they update frequently during live games)
      cache.set(cacheKey, events, 30000);
    } else {
      console.log(`Serving cached events for game ${gameId}`);
    }

    res.json({
      gameId,
      events,
      count: (events as any[])?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching game events:', error);
    res.status(500).json({
      error: 'Failed to fetch game events',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/games/cache/stats - Cache statistics (for debugging)
router.get('/cache/stats', (req, res) => {
  const stats = cache.getStats();
  res.json(stats);
});

// DELETE /api/games/cache - Clear cache (for debugging)
router.delete('/cache', (req, res) => {
  cache.clear();
  res.json({ message: 'Cache cleared successfully' });
});

export default router;