import fs from 'fs/promises';
import path from 'path';
import { entityMasterService } from '../../services/entityMasterService.js';

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
 * Now integrates with master registry for better team management
 */
export async function getTeamDisplayName(teamName: string): Promise<string> {
  // First, try to find team in master registry by name
  try {
    const teams = await entityMasterService.searchTeams(teamName, 1);
    if (teams.length > 0 && teams[0].name.toLowerCase() === teamName.toLowerCase()) {
      return teams[0].name; // Use canonical name from master registry
    }
  } catch (error) {
    console.warn('Failed to search master registry for team:', teamName, error);
  }

  // Fallback to legacy override system
  const teamId = await getTeamId(teamName);
  if (!teamId) return teamName;

  const overrides = await loadTeamOverrides();
  const override = overrides.mappings[teamId];
  return override?.displayName || teamName;
}

/**
 * Get team ID for a team name (for logo lookup)
 * Now searches master registry first, then falls back to override mappings
 */
export async function getTeamId(teamName: string): Promise<string | null> {
  // First, try to find team in master registry by name
  try {
    const teams = await entityMasterService.searchTeams(teamName, 5); // Get top 5 matches
    for (const team of teams) {
      if (team.name.toLowerCase() === teamName.toLowerCase()) {
        return team.id; // Exact match found in master registry
      }
    }
  } catch (error) {
    console.warn('Failed to search master registry for team ID:', teamName, error);
  }

  // Fallback to legacy override system
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
 * Get team information by ID from master registry
 * Returns team entity if found, null otherwise
 */
export async function getTeamById(teamId: string): Promise<{id: string, name: string, league?: string} | null> {
  try {
    const team = await entityMasterService.getTeam(teamId);
    return team ? {
      id: team.id,
      name: team.name,
      league: team.league
    } : null;
  } catch (error) {
    console.warn('Failed to get team by ID from master registry:', teamId, error);
    return null;
  }
}

/**
 * Search teams in master registry
 * Returns array of matching teams
 */
export async function searchTeams(query: string, limit: number = 10): Promise<Array<{id: string, name: string, league?: string}>> {
  try {
    const teams = await entityMasterService.searchTeams(query, limit);
    return teams.map(team => ({
      id: team.id,
      name: team.name,
      league: team.league
    }));
  } catch (error) {
    console.warn('Failed to search teams in master registry:', query, error);
    return [];
  }
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