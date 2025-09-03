export interface Team {
  id: string;
  name: string;
  short_name: string;
  logo?: string;
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