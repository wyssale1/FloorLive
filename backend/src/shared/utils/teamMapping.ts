import fs from 'fs/promises';
import path from 'path';

interface TeamOverride {
  mappingNames: string[];
  displayName?: string;
}

interface TeamOverrides {
  _instructions: string;
  mappings: Record<string, TeamOverride>;
}

let teamOverridesCache: TeamOverrides | null = null;

/**
 * Load team overrides from JSON file
 */
async function loadTeamOverrides(): Promise<TeamOverrides> {
  if (teamOverridesCache) {
    return teamOverridesCache;
  }

  try {
    const overridesPath = path.join(process.cwd(), 'data', 'team-overrides.json');
    const data = await fs.readFile(overridesPath, 'utf-8');
    teamOverridesCache = JSON.parse(data);
    return teamOverridesCache!;
  } catch (error) {
    console.warn('Could not load team overrides, using empty mappings:', error);
    teamOverridesCache = { _instructions: '', mappings: {} };
    return teamOverridesCache;
  }
}

/**
 * Get display name for a team (with override if available)
 */
export async function getTeamDisplayName(teamName: string): Promise<string> {
  const teamId = await getTeamId(teamName);
  if (!teamId) return teamName;
  
  const overrides = await loadTeamOverrides();
  const override = overrides.mappings[teamId];
  return override?.displayName || teamName;
}

/**
 * Get team ID for a team name (for logo lookup)
 * Searches through all mappingNames arrays to find matching team ID
 */
export async function getTeamId(teamName: string): Promise<string | null> {
  const overrides = await loadTeamOverrides();
  
  // Search through all team IDs and their mappingNames
  for (const [teamId, teamData] of Object.entries(overrides.mappings)) {
    if (teamData.mappingNames && teamData.mappingNames.includes(teamName)) {
      return teamId;
    }
  }
  
  return null;
}


/**
 * Legacy function - maps/normalizes team names from API response
 * @deprecated Use getTeamDisplayName instead
 */
export function mapTeamName(apiTeamName: string): string {
  // For backward compatibility, return original name
  // Real mapping now happens async via getTeamDisplayName
  return apiTeamName;
}

// League ordering preferences
export const LEAGUE_ORDER_PREFERENCES = [
  'Herren L-UPL',
  'Damen L-UPL', 
  'Herren NLB',
  'Damen NLB'
];

export function sortLeagues(leagues: string[]): string[] {
  return [
    // First, add leagues in preferred order (only if they have games)
    ...LEAGUE_ORDER_PREFERENCES.filter(league => leagues.includes(league)),
    // Then add remaining leagues alphabetically
    ...leagues.filter(league => !LEAGUE_ORDER_PREFERENCES.includes(league)).sort()
  ];
}