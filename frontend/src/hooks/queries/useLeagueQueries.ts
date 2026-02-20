import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'

// League Configuration for lazy-loading
export function useLeagueConfig(enabled = true) {
    return useQuery({
        queryKey: ['leagues', 'config'] as const,
        queryFn: () => apiClient.getLeagueConfig(),
        enabled,
        staleTime: 60 * 60 * 1000,
        gcTime: 24 * 60 * 60 * 1000,
    })
}
