import { getTeamDisplayName, getTeamId } from '../shared/utils/teamMapping.js';
import { logoService } from '../services/logoService.js';

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
 * This downloads and processes logos from Swiss Unihockey if available
 */
export function triggerBackgroundLogoProcessing(games: any[]): void {
  // Fire-and-forget processing - don't await
  setImmediate(() => {
    for (const game of games) {
      if (game.home_team) {
        processTeamLogoBackground(game.home_team);
      }
      
      if (game.away_team) {
        processTeamLogoBackground(game.away_team);
      }
    }
  });
}

async function processTeamLogos(team: any): Promise<void> {
  if (!team.name) return;
  
  // Apply display name override if available
  team.name = await getTeamDisplayName(team.name);
  
  // Try to get team ID from manual mapping
  const teamId = await getTeamId(team.name);
  
  if (teamId) {
    // Only add logoUrls if processed logo actually exists
    const hasValidLogo = await logoService.hasValidLogo(teamId);
    if (hasValidLogo) {
      team.logoUrls = logoService.getLogoUrls(teamId);
    }
  }
  // If no team ID mapping exists, no logo URLs are added
}

/**
 * Process team logo in background (from Swiss Unihockey URL)
 * Only processes if team has a Swiss Unihockey logo and we don't have a processed one
 */
function processTeamLogoBackground(team: any): void {
  if (!team?.id || !team?.logo) return;
  
  const teamId = team.id.toString();
  const logoUrl = team.logo;
  const teamName = team.name || team.short_name || '';
  
  // Trigger background processing - logoService handles duplicate checking
  logoService.processTeamLogoBackground(teamId, logoUrl, teamName);
}