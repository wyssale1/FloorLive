export type GameStatus = 'live' | 'today' | 'recent'

export type Team = {
  id: string
  name: string
  shortName: string
  logo: string
}

export type Game = {
  id: string
  homeTeam: Team
  awayTeam: Team
  homeScore: number
  awayScore: number
  status: GameStatus
  period?: string
  time?: string
  league: string
  startTime?: string
  isLive: boolean
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

export const teams: Team[] = [
  {
    id: '1',
    name: 'ZSC Lions',
    shortName: 'ZSC',
    logo: '🦁'
  },
  {
    id: '2', 
    name: 'HC Davos',
    shortName: 'HCD',
    logo: '🛡️'
  },
  {
    id: '3',
    name: 'Floorball Köniz',
    shortName: 'FBK',
    logo: '⚫'
  },
  {
    id: '4',
    name: 'UHC Alligator Malans',
    shortName: 'UAM',
    logo: '🐊'
  },
  {
    id: '5',
    name: 'Unihockey Basel Regio',
    shortName: 'UBR',
    logo: '🏒'
  },
  {
    id: '6',
    name: 'SV Wiler-Ersigen',
    shortName: 'SWE',
    logo: '⭐'
  },
  {
    id: '7',
    name: 'UHC Thun',
    shortName: 'UHT',
    logo: '🏔️'
  },
  {
    id: '8',
    name: 'Floorball Thurgau',
    shortName: 'FBT',
    logo: '🔵'
  },
  {
    id: '9',
    name: 'Grasshopper Club',
    shortName: 'GCZ',
    logo: '🦗'
  },
  {
    id: '10',
    name: 'UHC Dietlikon',
    shortName: 'UHD',
    logo: '🔴'
  }
]

export const games: Game[] = [
  // Live games
  {
    id: '1',
    homeTeam: teams[0], // ZSC Lions
    awayTeam: teams[1], // HC Davos  
    homeScore: 2,
    awayScore: 1,
    status: 'live',
    period: '2nd Period',
    time: '12:34',
    league: 'NLA',
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
    league: 'NLB',
    isLive: true
  },
  
  // Today's games
  {
    id: '3',
    homeTeam: teams[4], // Unihockey Basel Regio
    awayTeam: teams[5], // SV Wiler-Ersigen
    homeScore: 0,
    awayScore: 0,
    status: 'today',
    startTime: '19:30',
    league: 'NLA',
    isLive: false
  },
  {
    id: '4',
    homeTeam: teams[6], // UHC Thun
    awayTeam: teams[7], // Floorball Thurgau
    homeScore: 0,
    awayScore: 0,
    status: 'today',
    startTime: '20:00',
    league: 'NLB',
    isLive: false
  },

  // Recent games
  {
    id: '5',
    homeTeam: teams[8], // Grasshopper Club
    awayTeam: teams[9], // UHC Dietlikon
    homeScore: 4,
    awayScore: 2,
    status: 'recent',
    league: 'NLA',
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

export function getGamesByStatus(status: GameStatus): Game[] {
  return games.filter(game => game.status === status)
}

export function getGameById(id: string): Game | undefined {
  return games.find(game => game.id === id)
}

export function getGameEvents(gameId: string): GameEvent[] {
  return gameEvents.filter(event => event.gameId === gameId)
}