import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { addDays, format } from 'date-fns';

/**
 * Custom hook to find the next date with scheduled games
 * Searches incrementally day by day until games are found
 */
export function useNextGameFinder(currentDate: Date, enabled: boolean = true) {
    return useQuery({
        queryKey: ['nextGameDate', format(currentDate, 'yyyy-MM-dd')],
        queryFn: async () => {
            let searchDate = addDays(currentDate, 1);
            const maxDaysToSearch = 30; // Limit search to 30 days ahead

            for (let i = 0; i < maxDaysToSearch; i++) {
                const formattedDate = format(searchDate, 'yyyy-MM-dd');
                const games = await apiClient.getGamesByDate(formattedDate);

                if (games.length > 0) {
                    return {
                        date: searchDate,
                        formattedDate,
                        gamesCount: games.length
                    };
                }

                searchDate = addDays(searchDate, 1);
            }

            // No games found in the next 30 days
            return null;
        },
        enabled,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        retry: false
    });
}
