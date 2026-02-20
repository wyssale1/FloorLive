import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import { queryKeys } from './queryKeys'

export function useGamesByDate(date: string) {
    return useQuery({
        queryKey: queryKeys.games.byDate(date),
        queryFn: () => apiClient.getGamesByDate(date),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    })
}

export function useLiveGames() {
    return useQuery({
        queryKey: queryKeys.games.live(),
        queryFn: () => apiClient.getLiveGames(),
        staleTime: 30 * 1000,
        gcTime: 2 * 60 * 1000,
        refetchInterval: 30 * 1000,
    })
}

export function useGameDetail(gameId: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.games.detail(gameId),
        queryFn: async () => {
            const game = await apiClient.getGameDetails(gameId)
            return game ? game : null
        },
        enabled: !!gameId && enabled,
        staleTime: 2 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    })
}

export function useGameEvents(gameId: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.games.events(gameId),
        queryFn: () => apiClient.getGameEvents(gameId),
        enabled: !!gameId && enabled,
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
    })
}

export function useLiveGameDetail(gameId: string, isLive: boolean, enabled = true) {
    return useQuery({
        queryKey: queryKeys.games.detail(gameId),
        queryFn: async () => {
            const game = await apiClient.getGameDetails(gameId)
            return game ? game : null
        },
        enabled: !!gameId && enabled && isLive,
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchInterval: isLive ? 30 * 1000 : false,
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
            return game ? game : null
        },
        enabled: !!gameId && enabled,
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: (query) => {
            // Only poll if game is potentially live
            const data = query.state.data
            const isLive = data?.status === 'live'
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
