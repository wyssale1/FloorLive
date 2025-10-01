import { entityMasterService } from './entityMasterService.js';

/**
 * League Resolver Service
 *
 * Resolves league metadata (id, name, gameClass, group) from team IDs
 * by looking up team data in entities-master.json.
 */
export class LeagueResolver {
  /**
   * Get league metadata for a team
   * @param teamId - The team ID to look up
   * @returns League metadata or null if not found
   */
  async getLeagueForTeam(teamId: string): Promise<{
    id: string;
    name: string;
    gameClass?: number;
    group?: string | null;
  } | null> {
    try {
      const team = await entityMasterService.getTeam(teamId);

      if (!team || !team.league) {
        return null;
      }

      return {
        id: team.league.id,
        name: team.league.name,
        gameClass: team.league.gameClass,
        group: team.league.group
      };
    } catch (error) {
      console.error(`Error resolving league for team ${teamId}:`, error);
      return null;
    }
  }

  /**
   * Get league metadata for multiple teams (useful when we want to find common league)
   * @param teamIds - Array of team IDs to look up
   * @returns Array of league metadata (may contain nulls)
   */
  async getLeaguesForTeams(teamIds: string[]): Promise<Array<{
    id: string;
    name: string;
    gameClass?: number;
    group?: string | null;
  } | null>> {
    const leagues = await Promise.all(
      teamIds.map(teamId => this.getLeagueForTeam(teamId))
    );

    return leagues;
  }

  /**
   * Find common league between two teams (for games)
   * Returns the first non-null league metadata found
   * @param homeTeamId - Home team ID
   * @param awayTeamId - Away team ID
   * @returns League metadata or null if neither team has league info
   */
  async getCommonLeague(homeTeamId: string, awayTeamId: string): Promise<{
    id: string;
    name: string;
    gameClass?: number;
    group?: string | null;
  } | null> {
    const [homeLeague, awayLeague] = await Promise.all([
      this.getLeagueForTeam(homeTeamId),
      this.getLeagueForTeam(awayTeamId)
    ]);

    // Prefer home team's league, fallback to away team's league
    return homeLeague || awayLeague;
  }
}

// Singleton instance
export const leagueResolver = new LeagueResolver();
