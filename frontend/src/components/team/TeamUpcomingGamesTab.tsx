import { Calendar } from 'lucide-react'
import GameCardSkeleton from '../GameCardSkeleton'
import GameList from '../GameList'

interface TeamUpcomingGamesTabProps {
    games: any[]
    isLoading: boolean
}

export default function TeamUpcomingGamesTab({ games, isLoading }: TeamUpcomingGamesTabProps) {
    return (
        <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-4 h-4 text-gray-600" />
                <h2 className="text-lg font-medium text-gray-800">Upcoming Games</h2>
                <span className="text-sm text-gray-500">
                    {games.length} {games.length === 1 ? 'game' : 'games'}
                </span>
            </div>

            {isLoading ? (
                <GameCardSkeleton variant="list" count={3} />
            ) : games.length > 0 ? (
                <GameList games={games} showSeparators={true} showDate={true} noPaddingOnMobile={true} />
            ) : (
                <div className="text-center py-8">
                    <div className="text-gray-400 text-sm mb-1">No upcoming games scheduled</div>
                    <div className="text-gray-500 text-xs">
                        Check back later for future fixtures.
                    </div>
                </div>
            )}
        </div>
    )
}
