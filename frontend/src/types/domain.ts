/**
 * Frontend UI Domain Types
 *
 * Clean, React-optimized types using camelCase conventions.
 * These represent the core business entities as used by the frontend components.
 */

export type GameStatus = 'upcoming' | 'live' | 'finished';
export type LeagueType = 'NLA Men' | 'NLA Women' | 'NLB Men' | 'NLB Women';

export interface LogoUrls {
  large: Record<string, string>; // { avif: url, webp: url, png: url }
  small: Record<string, string>;
}

export interface League {
  id: string;
  name: string;
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
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
  logoUrls?: LogoUrls;
  hasLogo?: boolean;
}

export interface Game {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number | null;
  awayScore: number | null;
  status: GameStatus;
  period?: string;
  time?: string;
  startTime: string;
  gameDate: string;
  league: League;
  location?: string;
  venue?: Venue;
  coordinates?: Coordinates;
  referees?: Referees;
  spectators?: number;
  isLive?: boolean; // Convenience flag for UI
}

export interface GameEvent {
  id: string;
  gameId: string;
  time: string;
  type: 'goal' | 'penalty' | 'timeout' | 'other';
  player: string;
  assist?: string;
  description?: string;
  team: 'home' | 'away';
  teamName?: string;
  teamSide?: 'home' | 'away' | 'neutral';
  eventType?: string;
  icon?: string;
  displayAs?: string;
}

export interface Player {
  id: string;
  name: string;
  number?: string;
  position?: string;
  yearOfBirth?: number;
  height?: string;
  weight?: string;
  licenseType?: string;
  profileImage?: string;
  nationality?: string;
  birthPlace?: string;
  shoots?: 'L' | 'R';
  club?: {
    id: string;
    name: string;
    logo?: string;
  };
  careerStats?: {
    totalGames: number;
    totalGoals: number;
    totalAssists: number;
    totalPoints: number;
  };
  currentSeason?: {
    league: string;
    team: string;
    jerseyNumber?: string;
  };
}

export interface PlayerStatistics {
  season: string;
  league: string;
  team: string;
  teamId?: string;
  games: number;
  goals: number;
  assists: number;
  points: number;
  penalties: {
    twoMinute: number;
    fiveMinute: number;
    tenMinute: number;
    matchPenalty: number;
  };
}

export interface PlayerGamePerformance {
  gameDate: string;
  venue: string;
  gameTime: string;
  homeTeam: string;
  homeTeamId?: string;
  awayTeam: string;
  awayTeamId?: string;
  gameScore: string;
  playerGoals: number;
  playerAssists: number;
  playerPoints: number;
  matchPenalties: number;
}

export interface TeamRanking {
  position: number;
  teamId: string;
  teamName: string;
  teamLogo?: string | null;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
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

// UI-specific derived types
export interface GamesByLeague {
  [leagueName: string]: Game[];
}

export interface GameResponse {
  date: string;
  leagues: string[];
  gamesByLeague: GamesByLeague;
  totalGames: number;
  cached: boolean;
  hasGames: boolean;
}