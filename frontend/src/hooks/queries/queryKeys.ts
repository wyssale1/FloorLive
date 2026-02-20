export const queryKeys = {
    games: {
        all: ['games'] as const,
        byDate: (date: string) => ['games', 'byDate', date] as const,
        live: () => ['games', 'live'] as const,
        detail: (gameId: string) => ['games', 'detail', gameId] as const,
        events: (gameId: string) => ['games', 'events', gameId] as const,
    },
    teams: {
        all: ['teams'] as const,
        detail: (teamId: string) => ['teams', 'detail', teamId] as const,
        players: (teamId: string) => ['teams', 'players', teamId] as const,
        statistics: (teamId: string) => ['teams', 'statistics', teamId] as const,
        upcomingGames: (teamId: string) => ['teams', 'upcomingGames', teamId] as const,
        competitions: (teamId: string) => ['teams', 'competitions', teamId] as const,
    },
    players: {
        all: ['players'] as const,
        detail: (playerId: string) => ['players', 'detail', playerId] as const,
        statistics: (playerId: string) => ['players', 'statistics', playerId] as const,
    },
    rankings: {
        all: ['rankings'] as const,
        byLeague: (params: { season?: string; league?: string; game_class?: string; leagueName?: string; teamNames?: string[] }) =>
            ['rankings', 'byLeague', params] as const,
    },
} as const
