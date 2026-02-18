/**
 * API Integration Types
 *
 * Types for backend API communication and transformation utilities.
 * Handles conversion between backend snake_case and frontend camelCase.
 */

import type {
  Game, Team, GameEvent, Player, PlayerStatistics,
  PlayerGamePerformance, TeamRanking, GameResponse
} from './domain';

// Raw API Response Types (snake_case from backend)
export interface ApiTeam {
  id: string;
  name: string;
  short_name: string;
  logo?: string;
  logoUrls?: {
    large: Record<string, string>;
    small: Record<string, string>;
  };
  hasLogo?: boolean;
}

export interface ApiGame {
  id: string;
  home_team: ApiTeam;
  away_team: ApiTeam;
  home_score: number | null;
  away_score: number | null;
  status: 'upcoming' | 'live' | 'finished';
  period?: string;
  time?: string;
  start_time: string;
  game_date: string;
  league: {
    id: string;
    name: string;
  };
  location?: string;
  venue?: {
    name: string;
    address?: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
  referees?: {
    first?: string;
    second?: string;
  };
  spectators?: number;
  gamePhase?: 'regular' | 'cup' | 'playoff';
  playoffSeries?: {
    roundName: string;
    teamAName: string;
    teamAWins: number;
    teamBName: string;
    teamBWins: number;
    isFinished: boolean;
  };
}

export interface ApiGameEvent {
  id: string;
  game_id: string;
  time: string;
  type: 'goal' | 'penalty' | 'timeout' | 'other';
  player: string;
  assist?: string;
  description?: string;
  team: 'home' | 'away';
  team_name?: string;
  team_side?: 'home' | 'away' | 'neutral';
  event_type?: string;
  icon?: string;
  display_as?: string;
}

export interface ApiPlayer {
  id: string;
  name: string;
  number?: string;
  position?: string;
  year_of_birth?: number;
  height?: string;
  weight?: string;
  license_type?: string;
  profile_image?: string;
  nationality?: string;
  birth_place?: string;
  shoots?: 'L' | 'R';
  club?: {
    id: string;
    name: string;
    logo?: string;
  };
  career_stats?: {
    total_games: number;
    total_goals: number;
    total_assists: number;
    total_points: number;
  };
  current_season?: {
    league: string;
    team: string;
    jersey_number?: string;
  };
}

export interface ApiPlayerStatistics {
  season: string;
  league: string;
  team: string;
  team_id?: string;
  games: number;
  goals: number;
  assists: number;
  points: number;
  penalties: {
    two_minute: number;
    five_minute: number;
    ten_minute: number;
    match_penalty: number;
  };
}

export interface ApiPlayerGamePerformance {
  game_date: string;
  venue: string;
  game_time: string;
  home_team: string;
  home_team_id?: string;
  away_team: string;
  away_team_id?: string;
  game_score: string;
  player_goals: number;
  player_assists: number;
  player_points: number;
  match_penalties: number;
}

export interface ApiTeamRanking {
  position: number;
  team_id: string;
  team_name: string;
  team_logo?: string | null;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

// Backend API Response Wrapper Types
export interface ApiResponse<T> {
  date: string;
  leagues: string[];
  gamesByLeague: Record<string, T[]>;
  totalGames: number;
  cached: boolean;
  hasGames?: boolean;
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
    regions: ApiTeamRanking[][];
  };
}

// Transformation Utilities (API → Domain)
export const transformTeam = (apiTeam: ApiTeam): Team => ({
  id: apiTeam.id,
  name: apiTeam.name,
  shortName: apiTeam.short_name,
  logo: apiTeam.logo,
  logoUrls: apiTeam.logoUrls,
  hasLogo: apiTeam.hasLogo
});

export const transformGame = (apiGame: ApiGame): Game => ({
  id: apiGame.id,
  homeTeam: transformTeam(apiGame.home_team),
  awayTeam: transformTeam(apiGame.away_team),
  homeScore: apiGame.home_score,
  awayScore: apiGame.away_score,
  status: apiGame.status,
  period: apiGame.period,
  time: apiGame.time,
  startTime: apiGame.start_time,
  gameDate: apiGame.game_date,
  league: apiGame.league,
  location: apiGame.location,
  venue: apiGame.venue,
  coordinates: apiGame.coordinates,
  referees: apiGame.referees,
  spectators: apiGame.spectators,
  isLive: apiGame.status === 'live',
  gamePhase: apiGame.gamePhase,
  playoffSeries: apiGame.playoffSeries,
});

export const transformGameEvent = (apiEvent: ApiGameEvent): GameEvent => ({
  id: apiEvent.id,
  gameId: apiEvent.game_id,
  time: apiEvent.time,
  type: apiEvent.type,
  player: apiEvent.player,
  assist: apiEvent.assist,
  description: apiEvent.description,
  team: apiEvent.team,
  teamName: apiEvent.team_name,
  teamSide: apiEvent.team_side,
  eventType: apiEvent.event_type,
  icon: apiEvent.icon,
  displayAs: apiEvent.display_as
});

export const transformPlayer = (apiPlayer: ApiPlayer): Player => ({
  id: apiPlayer.id,
  name: apiPlayer.name,
  number: apiPlayer.number,
  position: apiPlayer.position,
  yearOfBirth: apiPlayer.year_of_birth,
  height: apiPlayer.height,
  weight: apiPlayer.weight,
  licenseType: apiPlayer.license_type,
  profileImage: apiPlayer.profile_image,
  nationality: apiPlayer.nationality,
  birthPlace: apiPlayer.birth_place,
  shoots: apiPlayer.shoots,
  club: apiPlayer.club,
  careerStats: apiPlayer.career_stats ? {
    totalGames: apiPlayer.career_stats.total_games,
    totalGoals: apiPlayer.career_stats.total_goals,
    totalAssists: apiPlayer.career_stats.total_assists,
    totalPoints: apiPlayer.career_stats.total_points
  } : undefined,
  currentSeason: apiPlayer.current_season ? {
    league: apiPlayer.current_season.league,
    team: apiPlayer.current_season.team,
    jerseyNumber: apiPlayer.current_season.jersey_number
  } : undefined
});

export const transformPlayerStatistics = (apiStats: ApiPlayerStatistics): PlayerStatistics => ({
  season: apiStats.season,
  league: apiStats.league,
  team: apiStats.team,
  teamId: apiStats.team_id,
  games: apiStats.games,
  goals: apiStats.goals,
  assists: apiStats.assists,
  points: apiStats.points,
  penalties: {
    twoMinute: apiStats.penalties.two_minute,
    fiveMinute: apiStats.penalties.five_minute,
    tenMinute: apiStats.penalties.ten_minute,
    matchPenalty: apiStats.penalties.match_penalty
  }
});

export const transformPlayerGamePerformance = (apiPerf: ApiPlayerGamePerformance): PlayerGamePerformance => ({
  gameDate: apiPerf.game_date,
  venue: apiPerf.venue,
  gameTime: apiPerf.game_time,
  homeTeam: apiPerf.home_team,
  homeTeamId: apiPerf.home_team_id,
  awayTeam: apiPerf.away_team,
  awayTeamId: apiPerf.away_team_id,
  gameScore: apiPerf.game_score,
  playerGoals: apiPerf.player_goals,
  playerAssists: apiPerf.player_assists,
  playerPoints: apiPerf.player_points,
  matchPenalties: apiPerf.match_penalties
});

export const transformTeamRanking = (apiRanking: ApiTeamRanking): TeamRanking => ({
  position: apiRanking.position,
  teamId: apiRanking.team_id,
  teamName: apiRanking.team_name,
  teamLogo: apiRanking.team_logo,
  games: apiRanking.games,
  wins: apiRanking.wins,
  draws: apiRanking.draws,
  losses: apiRanking.losses,
  goalsFor: apiRanking.goals_for,
  goalsAgainst: apiRanking.goals_against,
  goalDifference: apiRanking.goal_difference,
  points: apiRanking.points
});

export const transformGameResponse = (apiResponse: ApiResponse<ApiGame>): GameResponse => {
  const gamesByLeague: Record<string, Game[]> = {};

  Object.entries(apiResponse.gamesByLeague).forEach(([league, games]) => {
    gamesByLeague[league] = games.map(transformGame);
  });

  return {
    date: apiResponse.date,
    leagues: apiResponse.leagues,
    gamesByLeague,
    totalGames: apiResponse.totalGames,
    cached: apiResponse.cached,
    hasGames: apiResponse.hasGames ?? apiResponse.totalGames > 0
  };
};

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