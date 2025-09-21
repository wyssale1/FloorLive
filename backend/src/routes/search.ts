import { Router } from 'express';
import { entityMasterService } from '../services/entityMasterService.js';
import { assetService } from '../services/assetService.js';

const router = Router();

// GET /api/search?q=query - Combined search for teams and players
router.get('/', async (req, res) => {
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

    // Search both teams and players in parallel
    const [teams, players] = await Promise.all([
      entityMasterService.searchTeams(q.trim(), limitClamped),
      entityMasterService.searchPlayers(q.trim(), limitClamped)
    ]);

    // Format results for frontend with actual availability checks
    // URLs are guaranteed to work via fallback middleware, but we check actual availability for UI
    const formattedTeams = await Promise.all(teams.map(async team => ({
      id: team.id,
      name: team.name,
      league: team.league || 'Swiss Unihockey',
      hasLogo: await assetService.hasTeamLogo(team.id),
      logoUrl: `/assets/teams/team-${team.id}/small.webp`
    })));

    const formattedPlayers = await Promise.all(players.map(async player => ({
      id: player.id,
      name: player.name,
      team: player.team || null,
      hasImage: await assetService.hasPlayerImage(player.id),
      imageUrl: `/assets/players/player-${player.id}/${player.id}_small.webp`
    })));

    res.json({
      query: q.trim(),
      limit: limitClamped,
      teams: formattedTeams,
      players: formattedPlayers,
      totalResults: {
        teams: formattedTeams.length,
        players: formattedPlayers.length,
        total: formattedTeams.length + formattedPlayers.length
      }
    });

  } catch (error) {
    console.error('Error performing combined search:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to perform search'
    });
  }
});

export default router;