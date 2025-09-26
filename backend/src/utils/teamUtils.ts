/**
 * Team utilities for backend operations
 */

export async function getTeamDisplayName(name: string): Promise<string> {
  // Return the name as-is for now - can add mapping logic later if needed
  return name;
}

export async function getTeamId(name: string): Promise<string | null> {
  // Return null for now - can add ID mapping logic later if needed
  return null;
}

export function sortLeagues(leagueNames: string[]): string[] {
  // Simple alphabetical sort
  return leagueNames.sort();
}