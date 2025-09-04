import { logoService } from '../services/logoService.js';

/**
 * Add optimistic logo URLs to teams in games
 * Fast, synchronous operation - just generates URLs
 */
export function addOptimisticLogosToGames(games: any[]): void {
  games.forEach(game => {
    if (game.home_team) {
      const teamId = game.home_team.id || game.home_team.name?.replace(/\s+/g, '_');
      if (teamId) {
        game.home_team.logoUrls = logoService.getLogoUrls(teamId);
      }
    }
    
    if (game.away_team) {
      const teamId = game.away_team.id || game.away_team.name?.replace(/\s+/g, '_');
      if (teamId) {
        game.away_team.logoUrls = logoService.getLogoUrls(teamId);
      }
    }
  });
}