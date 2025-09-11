export interface Team {
  id: string;
  name: string;
  short_name: string;
  logo?: string;
  // Logo system additions
  logoUrls?: {
    large: Record<string, string>; // { avif: url, webp: url, png: url }
    small: Record<string, string>;
  };
  hasLogo?: boolean;
}

export interface Game {
  id: string;
  home_team: Team;
  away_team: Team;
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
  // New fields from enhanced backend processing
  team_name?: string;
  team_side?: 'home' | 'away' | 'neutral';
  event_type?: string;
  icon?: string;
  display_as?: string;
}

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

export interface ApiResponse<T> {
  date: string;
  leagues: string[];
  gamesByLeague: Record<string, T[]>;
  totalGames: number;
  cached: boolean;
}

// Frontend-specific types (for compatibility)
export type GameStatus = 'live' | 'upcoming' | 'finished';
export type LeagueType = 'NLA Men' | 'NLA Women' | 'NLB Men' | 'NLB Women';

// Additional types for new features
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
    regions: TeamRanking[][];
  };
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


// Frontend Game interface (camelCase version)
export interface FrontendGame {
  id: string;
  homeTeam: {
    id: string;
    name: string;
    shortName: string;
    logo: string;
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string;
    logo: string;
  };
  homeScore: number | null;
  awayScore: number | null;
  status: GameStatus;
  period?: string;
  time?: string;
  league: string;
  startTime: string;
  gameDate: string;
  isLive: boolean;
}

// Player-related interfaces (updated definitions)
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
  club?: {
    id: string;
    name: string;
    logo?: string;
  };
  // Additional fields from rich API response
  nationality?: string;
  birthPlace?: string;
  shoots?: 'L' | 'R'; // Left or Right handed
  // Career statistics summary
  careerStats?: {
    totalGames: number;
    totalGoals: number;
    totalAssists: number;
    totalPoints: number;
  };
  // Current season info
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