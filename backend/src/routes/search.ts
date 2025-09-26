import { Router } from 'express';
import { entityMasterService } from '../services/entityMasterService.js';
import { assetService } from '../services/assetService.js';

const router = Router();

// GET /api/search?q=query - Combined search for teams and players
router.get('/', async (req, res) => {
  const startTime = Date.now();
  console.log(`[SEARCH] Request received: ${req.url}`);

  try {
    const { q, limit } = req.query;
    console.log(`[SEARCH] Query params - q: "${q}", limit: "${limit}"`);

    if (!q || typeof q !== 'string') {
      console.log(`[SEARCH] Invalid query parameter: ${q}`);
      return res.status(400).json({
        error: 'Search query is required',
        message: 'Please provide a search query using the "q" parameter'
      });
    }

    if (q.trim().length < 2) {
      console.log(`[SEARCH] Query too short: "${q.trim()}" (${q.trim().length} chars)`);
      return res.status(400).json({
        error: 'Search query too short',
        message: 'Please provide at least 2 characters to search'
      });
    }

    const searchLimit = limit && typeof limit === 'string' ? parseInt(limit, 10) : 20;
    const limitClamped = Math.min(Math.max(searchLimit, 1), 100); // Between 1 and 100
    console.log(`[SEARCH] Using limit: ${limitClamped}`);

    // Get cache stats before search
    const stats = await entityMasterService.getStats();
    console.log(`[SEARCH] Entity stats before search:`, stats);

    // Search both teams and players in parallel
    console.log(`[SEARCH] Starting parallel search for: "${q.trim()}"`);
    const searchStartTime = Date.now();

    const [teams, players] = await Promise.all([
      entityMasterService.searchTeams(q.trim(), limitClamped),
      entityMasterService.searchPlayers(q.trim(), limitClamped)
    ]);

    const searchDuration = Date.now() - searchStartTime;
    console.log(`[SEARCH] Search completed in ${searchDuration}ms - Teams: ${teams.length}, Players: ${players.length}`);

    // Format results for frontend with actual availability checks
    // URLs are guaranteed to work via fallback middleware, but we check actual availability for UI
    const formattedTeams = await Promise.all(teams.map(async team => ({
      id: team.id,
      name: team.name,
      league: team.league || 'Swiss Unihockey',
      hasLogo: await assetService.hasTeamLogo(team.id),
      logoUrl: `/assets/teams/team-${team.id}/small.webp`
    })));

    const formattedPlayers = players.map(player => ({
      id: player.id,
      name: player.name,
      team: player.team || null,
      hasImage: assetService.hasPlayerDirectory(player.id),
      hasProcessedImages: assetService.hasPlayerDirectory(player.id),
      imageUrl: `/assets/players/player-${player.id}/${player.id}_small.webp`,
      jerseyNumber: player.jerseyNumber || null
    }));

    const totalDuration = Date.now() - startTime;
    const response = {
      query: q.trim(),
      limit: limitClamped,
      teams: formattedTeams,
      players: formattedPlayers,
      totalResults: {
        teams: formattedTeams.length,
        players: formattedPlayers.length,
        total: formattedTeams.length + formattedPlayers.length
      }
    };

    console.log(`[SEARCH] Response prepared - Teams: ${formattedTeams.length}, Players: ${formattedPlayers.length}, Total: ${response.totalResults.total}`);
    console.log(`[SEARCH] Request completed in ${totalDuration}ms`);

    res.json(response);

  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`[SEARCH] Error after ${totalDuration}ms:`, error);
    console.error(`[SEARCH] Error stack:`, (error as Error).stack);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to perform search'
    });
  }
});

export default router;