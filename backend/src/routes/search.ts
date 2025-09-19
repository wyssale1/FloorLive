import { Router } from 'express';
import { entityMasterService } from '../services/entityMasterService.js';
import { logoService } from '../services/logoService.js';
import { playerImageService } from '../services/playerImageService.js';

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

    // Check image availability for teams and players in parallel
    const [teamLogosAvailable, playerImagesAvailable] = await Promise.all([
      Promise.all(teams.map(team => logoService.hasLogo(team.id))),
      Promise.all(players.map(player => {
        const playerData = playerImageService.getPlayerMetadata(player.id);
        return playerData ? playerData.hasImage : false;
      }))
    ]);

    // Format results for frontend (matching GlobalMenu.tsx expected format)
    const formattedTeams = teams.map((team, index) => ({
      id: team.id,
      name: team.name,
      league: team.league || 'Swiss Unihockey',
      hasLogo: teamLogosAvailable[index],
      logoUrl: teamLogosAvailable[index] ? `/api/logos/team-${team.id}/small.webp` : null
    }));

    const formattedPlayers = players.map((player, index) => ({
      id: player.id,
      name: player.name,
      team: player.team || null,
      hasImage: playerImagesAvailable[index],
      imageUrl: playerImagesAvailable[index] ? `/assets/players/${player.id}/profile.webp` : null
    }));

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