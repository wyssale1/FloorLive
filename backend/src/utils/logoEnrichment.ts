import { getTeamDisplayName, getTeamId } from './teamUtils.js';

/**
 * Add optimistic logo URLs to teams in games
 * Uses simple team overrides mapping and API logo URLs
 */
export async function addOptimisticLogosToGames(games: any[]): Promise<void> {
  const logoPromises: Promise<void>[] = [];

  for (const game of games) {
    if (game.home_team) {
      logoPromises.push(processTeamLogos(game.home_team));
    }

    if (game.away_team) {
      logoPromises.push(processTeamLogos(game.away_team));
    }
  }

  await Promise.all(logoPromises);
}

/**
 * No-op function - kept for compatibility
 */
export function triggerBackgroundLogoProcessing(games: any[]): void {
  // No-op - logos now come directly from API
}

async function processTeamLogos(team: any): Promise<void> {
  if (!team.name) return;

  // Apply display name override if available
  team.name = await getTeamDisplayName(team.name);

  // Logo URLs now come from API response via team details
  // No local asset processing needed
}
