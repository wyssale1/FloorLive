import { m } from 'framer-motion'
import { Skeleton } from '../ui/skeleton'
import LeagueTable from '../LeagueTable'

interface TeamLeagueTablesTabProps {
    isLoading: boolean
    leagueTables: any[]
    teamId: string
    availableSeasons: string[]
    onSeasonChange: (season: string) => void
}

export default function TeamLeagueTablesTab({
    isLoading,
    leagueTables,
    teamId,
    availableSeasons,
    onSeasonChange
}: TeamLeagueTablesTabProps) {
    if (isLoading) {
        return (
            <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-6">
                <div className="space-y-4">
                    <Skeleton className="h-6 w-48 mb-6" />
                    {Array(12).fill(0).map((_, index) => (
                        <div key={`skeleton-${index}`} className="flex items-center justify-between py-2 border-b border-gray-100">
                            <div className="flex items-center space-x-3">
                                <Skeleton className="w-6 h-6 rounded-full" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <div className="flex items-center space-x-4">
                                <Skeleton className="h-4 w-8" />
                                <Skeleton className="h-4 w-8" />
                                <Skeleton className="h-4 w-8" />
                                <Skeleton className="h-4 w-8" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (leagueTables.length === 0) {
        return (
            <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-6">
                <div className="text-center py-12">
                    <div className="text-gray-400 text-sm mb-2">League table not yet available</div>
                    <div className="text-gray-500 text-xs">
                        Tables are published after the first games of the season. Check back once the season has started.
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {leagueTables.map((table, index) => (
                <m.div
                    key={table?.leagueId || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <LeagueTable
                        table={table}
                        currentTeamId={teamId}
                        availableSeasons={availableSeasons}
                        onSeasonChange={onSeasonChange}
                        seasonSelectorDisabled={isLoading}
                    />
                </m.div>
            ))}
        </div>
    )
}
