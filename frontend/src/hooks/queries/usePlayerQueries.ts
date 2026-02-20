import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import { queryKeys } from './queryKeys'

export function usePlayerDetail(playerId: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.players.detail(playerId),
        queryFn: () => apiClient.getPlayerDetails(playerId),
        enabled: !!playerId && enabled,
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
    })
}

export function usePlayerStatistics(playerId: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.players.statistics(playerId),
        queryFn: () => apiClient.getPlayerStatistics(playerId),
        enabled: !!playerId && enabled,
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
    })
}
