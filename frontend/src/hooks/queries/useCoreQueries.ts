import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from './queryKeys'

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
