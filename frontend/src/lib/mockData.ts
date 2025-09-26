import type { Game, GameStatus, LeagueType } from '../types/domain';

// Re-export types for convenience
export type { Game, GameStatus, LeagueType };

export type Team = {
  id: string
  name: string
  shortName: string
  logo: string
}

export type GameEvent = {
  id: string
  gameId: string
  time: string
  type: 'goal' | 'penalty'
  player: string
  assist?: string
  description?: string
  team: 'home' | 'away'
}

// Mock team data - no more emojis, just clean team names
export const teams: Team[] = [
  { id: '1', name: 'ZSC Lions Zürich', shortName: 'ZSC', logo: '' },
  { id: '2', name: 'HC Davos', shortName: 'HCD', logo: '' },
  { id: '3', name: 'Floorball Köniz', shortName: 'FBK', logo: '' },
  { id: '4', name: 'UHC Alligator Malans', shortName: 'UAM', logo: '' },
  { id: '5', name: 'Unihockey Basel Regio', shortName: 'UBR', logo: '' },
  { id: '6', name: 'SV Wiler-Ersigen', shortName: 'SWE', logo: '' },
  { id: '7', name: 'UHC Thun', shortName: 'UHT', logo: '' },
  { id: '8', name: 'Floorball Thurgau', shortName: 'FBT', logo: '' },
  { id: '9', name: 'Grasshopper Club Zürich', shortName: 'GCZ', logo: '' },
  { id: '10', name: 'UHC Dietlikon', shortName: 'UHD', logo: '' }
];

// Helper to create date strings
const today = new Date().toISOString().split('T')[0]
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

export const games: FrontendGame[] = [
  // Live games - Today
  {
    id: '1',
    homeTeam: teams[0], // ZSC Lions
    awayTeam: teams[1], // HC Davos  
    homeScore: 2,
    awayScore: 1,
    status: 'live',
    period: '2nd Period',
    time: '12:34',
    league: 'NLA Men',
    startTime: '19:30',
    gameDate: today,
    isLive: true
  },
  {
    id: '2', 
    homeTeam: teams[2], // Floorball Köniz
    awayTeam: teams[3], // UHC Alligator Malans
    homeScore: 0,
    awayScore: 3,
    status: 'live',
    period: '3rd Period', 
    time: '05:22',
    league: 'NLB Men',
    startTime: '20:15',
    gameDate: today,
    isLive: true
  },
  
  // Today's upcoming games
  {
    id: '3',
    homeTeam: teams[4], // Unihockey Basel Regio
    awayTeam: teams[5], // SV Wiler-Ersigen
    homeScore: null,
    awayScore: null,
    status: 'upcoming',
    startTime: '19:30',
    league: 'NLA Women',
    gameDate: today,
    isLive: false
  },
  {
    id: '4',
    homeTeam: teams[6], // UHC Thun
    awayTeam: teams[7], // Floorball Thurgau
    homeScore: null,
    awayScore: null,
    status: 'upcoming',
    startTime: '20:00',
    league: 'NLB Women',
    gameDate: today,
    isLive: false
  },

  // Finished games - Yesterday
  {
    id: '5',
    homeTeam: teams[8], // Grasshopper Club
    awayTeam: teams[9], // UHC Dietlikon
    homeScore: 4,
    awayScore: 2,
    status: 'finished',
    startTime: '19:00',
    league: 'NLA Men',
    gameDate: yesterday,
    isLive: false
  },
  
  // Tomorrow's games
  {
    id: '6',
    homeTeam: teams[1], // HC Davos
    awayTeam: teams[0], // ZSC Lions
    homeScore: null,
    awayScore: null,
    status: 'upcoming',
    startTime: '18:00',
    league: 'NLA Men',
    gameDate: tomorrow,
    isLive: false
  }
]

export const gameEvents: GameEvent[] = [
  // Events for ZSC Lions vs HC Davos (game 1)
  {
    id: '1',
    gameId: '1',
    time: '38:15',
    type: 'goal',
    player: 'Marco Lehmann',
    assist: 'Thomas Weber',
    team: 'home'
  },
  {
    id: '2',
    gameId: '1', 
    time: '35:42',
    type: 'penalty',
    player: 'Stefan Müller',
    description: '2min - Tripping',
    team: 'home'
  },
  {
    id: '3',
    gameId: '1',
    time: '28:33',
    type: 'goal',
    player: 'David Schneider',
    assist: 'Lukas Fischer',
    team: 'home'
  },
  {
    id: '4',
    gameId: '1',
    time: '22:18',
    type: 'penalty',
    player: 'Andreas Meier',
    description: '2min - High stick',
    team: 'home'
  },
  {
    id: '5',
    gameId: '1',
    time: '15:07',
    type: 'goal',
    player: 'Michael Bauer',
    assist: 'Patrick Keller',
    team: 'home'
  }
]

export function getGamesByDate(date: Date): FrontendGame[] {
  const dateString = date.toISOString().split('T')[0]
  return games.filter(game => 
    game.gameDate === dateString
  )
}

export function getGamesByLeague(games: FrontendGame[], league: LeagueType): FrontendGame[] {
  return games.filter(game => game.league === league)
}

export function getGameById(id: string): FrontendGame | undefined {
  return games.find(game => game.id === id)
}

export function getGameEvents(gameId: string): GameEvent[] {
  return gameEvents.filter(event => event.gameId === gameId)
}

// Helper to get all leagues that have games on a specific date
export function getLeaguesForDate(date: Date): LeagueType[] {
  const gamesForDate = getGamesByDate(date)
  const leagues = [...new Set(gamesForDate.map(game => game.league))]
  return leagues.filter(league => 
    ['NLA Men', 'NLA Women', 'NLB Men', 'NLB Women'].includes(league)
  ).sort() as LeagueType[] // Filter and cast to LeagueType
}