/**
 * Simple team mapping utilities
 * Simplified version for better maintainability
 */

export async function getTeamDisplayName(name: string): Promise<string> {
  // Return the name as-is for now - simplifying the complex mapping
  return name;
}

export async function getTeamId(name: string): Promise<string | null> {
  // Return null for now - simplifying the complex ID mapping
  return null;
}

export function sortLeagues(leagueNames: string[]): string[] {
  // Simple alphabetical sort - removing complex league priority logic
  return leagueNames.sort();
}