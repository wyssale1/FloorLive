import { Clock } from 'lucide-react'
import GameTimeline from '../GameTimeline'

interface GameEventsTabProps {
    gameStatus?: string
    wsConnected: boolean
    events: any[]
}

export default function GameEventsTab({ gameStatus, wsConnected, events }: GameEventsTabProps) {
    return (
        <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-3 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-6">
                <h2 className="text-lg font-medium text-gray-800">Game Timeline</h2>
                {gameStatus === 'live' && (
                    <div className="flex items-center space-x-2">
                        {wsConnected ? (
                            <>
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span className="text-sm text-green-600">Live connected</span>
                            </>
                        ) : (
                            <>
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">Live updates...</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            <GameTimeline events={events} />
        </div>
    )
}
