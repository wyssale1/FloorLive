import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../lib/apiClient'
import { queryKeys } from './queryKeys'

export function useTeamDetail(teamId: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.teams.detail(teamId),
        queryFn: () => apiClient.getTeamDetails(teamId),
        enabled: !!teamId && enabled,
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    })
}

export function useTeamPlayers(teamId: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.teams.players(teamId),
        queryFn: () => apiClient.getTeamPlayers(teamId),
        enabled: !!teamId && enabled,
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    })
}

export function useTeamStatistics(teamId: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.teams.statistics(teamId),
        queryFn: () => apiClient.getTeamStatistics(teamId),
        enabled: !!teamId && enabled,
        staleTime: 15 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
    })
}

export function useTeamUpcomingGames(teamId: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.teams.upcomingGames(teamId),
        queryFn: () => apiClient.getTeamUpcomingGames(teamId),
        enabled: !!teamId && enabled,
        staleTime: 5 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
    })
}

export function useTeamCompetitions(teamId: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.teams.competitions(teamId),
        queryFn: () => apiClient.getTeamCompetitions(teamId),
        enabled: !!teamId && enabled,
        staleTime: 30 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
    })
}
