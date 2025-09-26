/**
 * API Client Types
 *
 * Types specifically for Swiss Unihockey API communication.
 * These represent the raw API responses and request parameters.
 */

export interface SwissUnihockeyApiResponse<T> {
  context: any;
  title: string;
  headers: string[];
  regions: T[];
}

export interface GameListParams {
  mode?: 'current' | 'list' | 'club' | 'team' | 'cup' | 'direct' | 'favorite';
  league_ids?: string[];
  game_class_ids?: string[];
  tournament_ids?: string[];
  season?: string;
  club_id?: string;
  team_id?: string;
  date_from?: string;
  date_to?: string;
  on_date?: string;
  before_date?: string;
  after_date?: string;
}

export interface RankingsApiResponse {
  type: string;
  subtype: string;
  doc: string;
  data: {
    context: {
      season?: string;
      league?: string;
      game_class?: string;
      group?: string;
    };
    headers: string[];
    title: string;
    tabs?: any[];
    regions: any[][]; // Raw API ranking data
  };
}

export interface ApiResponse<T> {
  date: string;
  leagues: string[];
  gamesByLeague: Record<string, T[]>;
  totalGames: number;
  cached: boolean;
}

/**
 * Utility function to determine game_class from league name and optional player data
 * Based on Swiss Unihockey API patterns:
 * - Men's leagues: game_class = '11'
 * - Women's leagues: game_class = '21'
 */
export function determineGameClass(leagueName?: string, players?: any[]): string {
  if (!leagueName) {
    return '11'; // Default to men's
  }

  const leagueLower = leagueName.toLowerCase();

  // Check for explicit women's indicators in league name
  if (
    leagueLower.includes('damen') ||
    leagueLower.includes('women') ||
    leagueLower.includes('dnlb') ||
    leagueLower.includes('female') ||
    leagueLower.includes('frauen')
  ) {
    return '21'; // Women's game class
  }

  // For ambiguous leagues like "L-UPL", use player position data
  if (players && players.length > 0) {
    const femininePositions = players.filter(player => {
      const position = player.position?.toLowerCase() || '';
      return (
        position.includes('stürmerin') ||
        position.includes('verteidigerin') ||
        position.includes('torhüterin')
      );
    });

    // If more than 30% of players have feminine positions, it's likely a women's team
    if (femininePositions.length > 0 && femininePositions.length / players.length >= 0.3) {
      return '21'; // Women's game class
    }
  }

  return '11'; // Default to men's game class
}