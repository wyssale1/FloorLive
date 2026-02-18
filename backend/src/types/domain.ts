/**
 * Backend Domain Types
 *
 * Clean, purpose-built types for the backend's domain model.
 * These types represent the core business entities as used by the backend services.
 */

export type GameStatus = 'upcoming' | 'live' | 'finished';

export interface LogoUrls {
  large: Record<string, string>; // { avif: url, webp: url, png: url }
  small: Record<string, string>;
}

export interface League {
  id: string;
  name: string;
  gameClass?: number;
  group?: string | null;
}

export interface Venue {
  name: string;
  address?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Referees {
  first?: string;
  second?: string;
  [key: number]: string;
}

export interface Team {
  id: string;
  name: string;
  short_name: string;
  logo?: string;
  logoUrls?: LogoUrls;
  hasLogo?: boolean;
}

export interface Game {
  id: string;
  home_team: Team;
  away_team: Team;
  home_score: number | null;
  away_score: number | null;
  status: GameStatus;
  period?: string;
  time?: string;
  start_time: string;
  game_date: string;
  league: League;
  location?: string;
  venue?: Venue;
  coordinates?: Coordinates;
  referees?: Referees;
  spectators?: number;
  gamePhase?: 'regular' | 'cup' | 'playoff';
  playoffSeries?: PlayoffSeries;
}

export interface PlayoffSeries {
  roundName: string;       // e.g. "Viertelfinal", "Halbfinal", "Final"
  teamAName: string;
  teamAWins: number;
  teamBName: string;
  teamBWins: number;
  isFinished: boolean;
}

export interface GameEvent {
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

export interface Player {
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

export interface PlayerStatistics {
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

export interface PlayerGamePerformance {
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

export interface TeamRanking {
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

export interface TeamStatistics {
  achievements?: Array<{
    competition: string;
    season: string;
    result: string;
  }>;
  seasons?: Array<{
    season: string;
    league: string;
    position?: string;
    games?: number;
    wins?: number;
  }>;
}