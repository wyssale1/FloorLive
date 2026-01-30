import { Router } from 'express';
import { format, parseISO, isValid } from 'date-fns';
import { SwissUnihockeyApiClient } from '../services/swissUnihockeyApi.js';
import { CacheService } from '../services/cacheService.js';
import { requestBatcher } from '../services/requestBatcher.js';
import { sortLeagues } from '../utils/teamUtils.js';
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

    // Enrich live games with real-time scores from individual game details
    const liveGames = validGames.filter(game => game.status === 'live');

    if (liveGames.length > 0) {
      console.log(`Found ${liveGames.length} live games, fetching detailed scores...`);

      try {
        // Fetch detailed game data for all live games in parallel
        const liveGameDetailsPromises = liveGames.map(async (game) => {
          try {
            const gameDetails = await apiClient.getGameDetails(game.id);
            return { gameId: game.id, details: gameDetails };
          } catch (error) {
            console.warn(`Failed to fetch details for live game ${game.id}:`, error);
            return { gameId: game.id, details: null };
          }
        });

        // Wait for all requests to complete (with a reasonable timeout)
        const liveGameDetails = await Promise.allSettled(liveGameDetailsPromises);

        // Update live games with real scores
        liveGameDetails.forEach((result) => {
          if (result.status === 'fulfilled' && result.value.details) {
            const { gameId, details } = result.value;

            // Find the game in our validGames array and update scores
            const gameIndex = validGames.findIndex(g => g.id === gameId);
            if (gameIndex !== -1 && details.home_score !== null && details.away_score !== null) {
              console.log(`Updating live scores for game ${gameId}: ${details.home_score}:${details.away_score}`);
              validGames[gameIndex].home_score = details.home_score;
              validGames[gameIndex].away_score = details.away_score;

              // Also update in gamesByLeague structure
              Object.keys(gamesByLeague).forEach(league => {
                const leagueGameIndex = gamesByLeague[league].findIndex(g => g.id === gameId);
                if (leagueGameIndex !== -1) {
                  gamesByLeague[league][leagueGameIndex].home_score = details.home_score;
                  gamesByLeague[league][leagueGameIndex].away_score = details.away_score;
                }
              });
            }
          }
        });

        console.log(`Live score enrichment completed for ${liveGames.length} games`);
      } catch (error) {
        console.warn('Live score enrichment failed, continuing with original scores:', error);
      }
    }

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

// GET /api/games/league - Get games for a specific league/group (lazy loading)
router.get('/league', async (req, res) => {
  try {
    const { date, league, game_class, group } = req.query;

    if (!date || !league || !game_class) {
      return res.status(400).json({
        error: 'Missing required parameters: date, league, game_class'
      });
    }

    const dateString = date.toString();
    const leagueId = parseInt(league.toString());
    const gameClass = parseInt(game_class.toString());
    const groupName = group ? group.toString() : undefined;

    if (isNaN(leagueId) || isNaN(gameClass)) {
      return res.status(400).json({
        error: 'league and game_class must be valid numbers'
      });
    }

    // Cache key includes group for proper caching
    const cacheKey = `games:league:${dateString}:${leagueId}:${gameClass}:${groupName || 'all'}`;
    let games = cache.get(cacheKey);

    if (!games) {
      games = await apiClient.getGamesByLeague({
        date: dateString,
        league: leagueId,
        gameClass,
        group: groupName,
      });

      // Cache for 5 minutes
      cache.set(cacheKey, games, 300000);
    }

    // Add optimistic logo URLs (non-blocking)
    addOptimisticLogosToGames(games as any[]).catch(err =>
      console.warn('Non-critical logo processing failed:', err)
    );

    res.json({
      date: dateString,
      league: leagueId,
      gameClass,
      group: groupName || null,
      games,
      count: (games as any[]).length,
      cached: games !== null
    });

  } catch (error) {
    console.error('Error fetching league games:', error);
    res.status(500).json({
      error: 'Failed to fetch league games',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/games/league/count - Get game count only for filtering
router.get('/league/count', async (req, res) => {
  try {
    const { date, league, game_class, group } = req.query;

    if (!date || !league || !game_class) {
      return res.status(400).json({ count: 0 });
    }

    const dateString = date.toString();
    const leagueId = parseInt(league.toString());
    const gameClass = parseInt(game_class.toString());
    const groupName = group ? group.toString() : undefined;

    if (isNaN(leagueId) || isNaN(gameClass)) {
      return res.status(400).json({ count: 0 });
    }

    const cacheKey = `league_count_${dateString}_${leagueId}_${gameClass}_${groupName || 'all'}`;
    let count = cache.get<number>(cacheKey);

    if (count === undefined) {
      const games = await apiClient.getGamesByLeague({
        date: dateString,
        league: leagueId,
        gameClass,
        group: groupName,
      });
      count = games.length;
      cache.set(cacheKey, count, 300000); // 5 min cache
    }

    res.json({ count });
  } catch (error) {
    console.error('Error fetching league game count:', error);
    res.status(500).json({ count: 0 });
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