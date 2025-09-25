import { Router } from 'express';
import { format, parseISO, isValid } from 'date-fns';
import { SwissUnihockeyApiClient } from '../services/swissUnihockeyApi.js';
import { CacheService } from '../services/cacheService.js';
import { requestBatcher } from '../services/requestBatcher.js';
import { sortLeagues } from '../shared/utils/teamMapping.js';
import { addOptimisticLogosToGames, triggerBackgroundLogoProcessing } from '../utils/logoEnrichment.js';

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
      try {
        // Use request batcher to deduplicate simultaneous requests for same date
        games = await requestBatcher.execute(`games:${dateString}`, () =>
          apiClient.getGamesByDate(dateString)
        );
        // Always cache the result, even if empty
        cache.setGames(dateString, games);
      } catch (error) {
        console.error(`Failed to fetch games for ${dateString}:`, error);
        games = []; // Return empty array on error
      }
    } else {
      fromCache = true;
    }

    // Filter out games with invalid team data
    const validGames = games.filter(game =>
      game &&
      game.home_team &&
      game.away_team &&
      game.home_team.name &&
      game.away_team.name &&
      game.league
    );

    // Group by league for frontend
    const gamesByLeague = validGames.reduce((acc, game) => {
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
    }, {} as Record<string, typeof validGames>);

    const leagueNames = Object.keys(gamesByLeague);
    const orderedLeagues = sortLeagues(leagueNames);

    // Add optimistic logo URLs to all valid games (async operation) - but don't block response
    addOptimisticLogosToGames(validGames).catch(err =>
      console.warn('Non-critical logo processing failed:', err)
    );

    res.json({
      date: dateString,
      leagues: orderedLeagues,
      gamesByLeague,
      totalGames: validGames.length,
      cached: fromCache,
      hasGames: validGames.length > 0
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
      liveGames = await apiClient.getCurrentGames();
      // Only cache if there are actual live games
      if (liveGames.length > 0) {
        cache.setLiveGames(liveGames);
      }
    }

    // Add optimistic logo URLs to live games (non-blocking)
    addOptimisticLogosToGames(liveGames).catch(err =>
      console.warn('Non-critical logo processing failed:', err)
    );

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
router.get('/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }

    // Check cache first
    const cacheKey = `game:${gameId}`;
    let game = cache.get(cacheKey);
    
    if (!game) {
      game = await apiClient.getGameDetails(gameId);
      
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      // Cache for shorter time if live, longer if finished
      const ttl = (game as any).status === 'live' ? 30000 : 3600000; // 30s vs 1h
      cache.set(cacheKey, game, ttl);
    }

    // Add optimistic logo URLs to the game (non-blocking)
    addOptimisticLogosToGames([game]).catch(err =>
      console.warn('Non-critical logo processing failed:', err)
    );

    // Trigger background logo processing (after response)
    triggerBackgroundLogoProcessing([game]);

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
      // Try to get cached game details first to avoid redundant API call
      const gameCacheKey = `game:${gameId}`;
      let gameDetails = cache.get(gameCacheKey);

      if (!gameDetails) {
        // If no cached game details, get them and cache for future use
        gameDetails = await apiClient.getGameDetails(gameId);
        if (gameDetails) {
          const ttl = (gameDetails as any).status === 'live' ? 30000 : 3600000;
          cache.set(gameCacheKey, gameDetails, ttl);
        }
      }

      // Now get events with optimized API client call
      events = await apiClient.getGameEventsOptimized(gameId, gameDetails);

      // Cache events for 30 seconds (they update frequently during live games)
      cache.set(cacheKey, events, 30000);
    }

    // Swiss API returns events in reverse chronological order (newest first) 
    // Keep this order for timeline display: "Spielende" at top, "Spielbeginn" at bottom
    const timelineEvents = [...(events as any[])];

    res.json({
      gameId,
      events: timelineEvents,
      count: timelineEvents.length,
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

// GET /api/games/:gameId/head-to-head - Get head-to-head games between two teams
router.get('/:gameId/head-to-head', async (req, res) => {
  try {
    const { gameId } = req.params;
    if (!gameId) return res.status(400).json({ error: 'Game ID is required' });

    let headToHeadGames = cache.get(`h2h:${gameId}`);
    
    if (!headToHeadGames) {
      headToHeadGames = (await apiClient.getHeadToHeadGames(gameId)).slice(0, 5);
      cache.set(`h2h:${gameId}`, headToHeadGames, 3600000);
    }

    await addOptimisticLogosToGames(headToHeadGames as any[]);

    res.json({
      gameId,
      games: headToHeadGames,
      count: (headToHeadGames as any[]).length
    });

  } catch (error) {
    console.error('Error fetching head-to-head games:', error);
    res.status(500).json({ error: 'Failed to fetch head-to-head games' });
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