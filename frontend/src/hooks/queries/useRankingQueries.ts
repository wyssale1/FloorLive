import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import { queryKeys } from './queryKeys'

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
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    })
}
