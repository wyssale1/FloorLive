import { getTeamDisplayName, getTeamId } from '../shared/utils/teamMapping.js';
import { assetService } from '../services/assetService.js';

/**
 * Add optimistic logo URLs to teams in games
 * Uses simple team overrides mapping
 */
export async function addOptimisticLogosToGames(games: any[]): Promise<void> {
  // Process all teams in parallel instead of sequentially
  const logoPromises: Promise<void>[] = [];

  for (const game of games) {
    if (game.home_team) {
      logoPromises.push(processTeamLogos(game.home_team));
    }

    if (game.away_team) {
      logoPromises.push(processTeamLogos(game.away_team));
    }
  }

  // Wait for all logo processing to complete in parallel
  await Promise.all(logoPromises);
}

/**
 * Trigger background logo processing for games (fire-and-forget)
 * Note: Logo processing is now done at build-time via scripts/image-processor.js
 * This function is kept for compatibility but does minimal work
 */
export function triggerBackgroundLogoProcessing(games: any[]): void {
  // No-op since we moved to build-time processing
  // Logos are now processed locally and committed to git
}

async function processTeamLogos(team: any): Promise<void> {
  if (!team.name) return;
  
  // Apply display name override if available
  team.name = await getTeamDisplayName(team.name);
  
  // Try to get team ID from manual mapping
  const teamId = await getTeamId(team.name);
  
  if (teamId) {
    // Only add logoUrls if processed logo actually exists
    const hasValidLogo = await assetService.hasTeamLogo(teamId);
    if (hasValidLogo) {
      team.logoUrls = assetService.getTeamLogoUrls(teamId);
    }
  }
  // If no team ID mapping exists, no logo URLs are added
}

