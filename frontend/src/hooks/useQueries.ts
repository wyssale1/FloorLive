import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../lib/apiClient'

// Query Keys - centralized for consistency and invalidation
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

// Custom Query Hooks

// Games
export function useGamesByDate(date: string) {
  return useQuery({
    queryKey: queryKeys.games.byDate(date),
    queryFn: () => apiClient.getGamesByDate(date),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
  })
}

export function useLiveGames() {
  return useQuery({
    queryKey: queryKeys.games.live(),
    queryFn: () => apiClient.getLiveGames(),
    staleTime: 30 * 1000, // 30 seconds for live games
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
  })
}

export function useGameDetail(gameId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.games.detail(gameId),
    queryFn: async () => {
      const game = await apiClient.getGameDetails(gameId)
      return game ? apiClient.adaptGameForFrontend(game) : null
    },
    enabled: !!gameId && enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useGameEvents(gameId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.games.events(gameId),
    queryFn: () => apiClient.getGameEvents(gameId),
    enabled: !!gameId && enabled,
    staleTime: 30 * 1000, // 30 seconds for events
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Teams
export function useTeamDetail(teamId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.teams.detail(teamId),
    queryFn: () => apiClient.getTeamDetails(teamId),
    enabled: !!teamId && enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function useTeamPlayers(teamId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.teams.players(teamId),
    queryFn: () => apiClient.getTeamPlayers(teamId),
    enabled: !!teamId && enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

export function useTeamStatistics(teamId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.teams.statistics(teamId),
    queryFn: () => apiClient.getTeamStatistics(teamId),
    enabled: !!teamId && enabled,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

export function useTeamUpcomingGames(teamId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.teams.upcomingGames(teamId),
    queryFn: () => apiClient.getTeamUpcomingGames(teamId),
    enabled: !!teamId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  })
}

export function useTeamCompetitions(teamId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.teams.competitions(teamId),
    queryFn: () => apiClient.getTeamCompetitions(teamId),
    enabled: !!teamId && enabled,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

// Players
export function usePlayerDetail(playerId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.players.detail(playerId),
    queryFn: () => apiClient.getPlayerDetails(playerId),
    enabled: !!playerId && enabled,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

export function usePlayerStatistics(playerId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.players.statistics(playerId),
    queryFn: () => apiClient.getPlayerStatistics(playerId),
    enabled: !!playerId && enabled,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  })
}

// Rankings
export function useRankings(params: {
  season?: string
  league?: string
  game_class?: string
  leagueName?: string
  teamNames?: string[]
}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.rankings.byLeague(params),
    queryFn: () => apiClient.getRankings(params),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Live Game Polling Hook - Enhanced with React Query
export function useLiveGamePolling(gameId: string, enabled = true) {
  const queryClient = useQueryClient()

  // Game details with automatic refetching
  const gameQuery = useQuery({
    queryKey: queryKeys.games.detail(gameId),
    queryFn: async () => {
      const game = await apiClient.getGameDetails(gameId)
      return game ? apiClient.adaptGameForFrontend(game) : null
    },
    enabled: !!gameId && enabled,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: (query) => {
      // Only poll if game is potentially live
      const data = query.state.data
      const isLive = data?.status === 'live' || data?.status === 'running'
      return isLive ? 30 * 1000 : false // 30 seconds if live, no polling otherwise
    },
  })

  // Game events with automatic refetching
  const eventsQuery = useQuery({
    queryKey: queryKeys.games.events(gameId),
    queryFn: () => apiClient.getGameEvents(gameId),
    enabled: !!gameId && enabled,
    staleTime: 15 * 1000, // 15 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: () => {
      // Only poll if game is potentially live
      const game = queryClient.getQueryData(queryKeys.games.detail(gameId))
      const isLive = (game as { status?: string })?.status === 'live' || (game as { status?: string })?.status === 'running'
      return isLive ? 15 * 1000 : false // 15 seconds if live, no polling otherwise
    },
  })

  return {
    game: gameQuery.data,
    events: eventsQuery.data || [],
    isLoading: gameQuery.isLoading || eventsQuery.isLoading,
    isError: gameQuery.isError || eventsQuery.isError,
    error: gameQuery.error || eventsQuery.error,
    refetch: () => {
      gameQuery.refetch()
      eventsQuery.refetch()
    },
  }
}

// Utility hook for invalidating related queries
export function useInvalidateQueries() {
  const queryClient = useQueryClient()

  return {
    invalidateGame: (gameId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games.detail(gameId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.games.events(gameId) })
    },
    invalidateTeam: (teamId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail(teamId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.players(teamId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.statistics(teamId) })
    },
    invalidatePlayer: (playerId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.players.detail(playerId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.players.statistics(playerId) })
    },
    invalidateGamesForDate: (date: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.games.byDate(date) })
    },
  }
}