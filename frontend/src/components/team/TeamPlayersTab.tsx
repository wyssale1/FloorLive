import { m } from 'framer-motion'
import { Users, Target, User, Hash } from 'lucide-react'
import PlayerListSkeleton from '../PlayerListSkeleton'
import TeamPlayersLegend from '../TeamPlayersLegend'
import PlayerImage from '../PlayerImage'
import PlayerLink from '../PlayerLink'

export function groupPlayersByPosition(players: any[]) {
    const categories = {
        'Goalies': [] as any[],
        'Defenders': [] as any[],
        'Forwards': [] as any[],
        'Additional Players': [] as any[]
    }

    players.forEach(player => {
        const position = player.position?.toLowerCase() || ''
        if (position.includes('goalie')) {
            categories['Goalies'].push(player)
        } else if (position.includes('verteidiger')) {
            categories['Defenders'].push(player)
        } else if (position.includes('stürmer')) {
            categories['Forwards'].push(player)
        } else {
            categories['Additional Players'].push(player)
        }
    })

    return Object.fromEntries(
        Object.entries(categories).filter(([, p]) => p.length > 0)
    )
}

interface TeamPlayersTabProps {
    players: any[]
    isLoading: boolean
}

export default function TeamPlayersTab({ players, isLoading }: TeamPlayersTabProps) {
    return (
        <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-3 sm:p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <h2 className="text-lg font-medium text-gray-800">Squad</h2>
                    <span className="text-sm text-gray-500 ml-2">
                        {players.length} {players.length === 1 ? 'player' : 'players'}
                    </span>
                </div>
                {players.length > 0 && players.some(player => player.goals > 0 || player.assists > 0 || player.points > 0) && (
                    <TeamPlayersLegend />
                )}
            </div>

            {isLoading ? (
                <PlayerListSkeleton />
            ) : players.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-gray-400 text-sm mb-2">No player information available</div>
                    <div className="text-gray-500 text-xs">
                        Player roster may not be published yet.
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupPlayersByPosition(players)).map(([category, categoryPlayers], categoryIndex) => (
                        <m.div
                            key={category}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: categoryIndex * 0.1 }}
                            className="space-y-3"
                        >
                            <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
                                {category} ({categoryPlayers.length})
                            </h3>
                            <div className="space-y-0 divide-y divide-gray-100">
                                {categoryPlayers.map((player, playerIndex) => (
                                    <m.div
                                        key={player.id || playerIndex}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: (categoryIndex * 0.1) + (playerIndex * 0.05) }}
                                        className="flex items-center justify-between py-3 first:pt-0"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <PlayerImage
                                                player={{
                                                    id: player.id || '',
                                                    name: player.name || '',
                                                    profileImage: player.profileImage
                                                }}
                                                size="small"
                                                className="flex-shrink-0"
                                                jerseyNumber={player.number}
                                                showNumberBadge={true}
                                            />
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-gray-800">
                                                    <PlayerLink
                                                        playerId={player.id && player.id.trim() ? player.id : ''}
                                                        playerName={player.name}
                                                    />
                                                </div>
                                                {player.yearOfBirth && (
                                                    <div className="text-xs text-gray-600">
                                                        Born {player.yearOfBirth}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {(player.goals > 0 || player.assists > 0 || player.points > 0) && (
                                            <div className="flex items-center space-x-3 text-xs text-gray-600 flex-shrink-0">
                                                {player.goals > 0 && (
                                                    <div className="flex items-center space-x-1">
                                                        <Target className="w-3 h-3" />
                                                        <span>{player.goals}</span>
                                                    </div>
                                                )}
                                                {player.assists > 0 && (
                                                    <div className="flex items-center space-x-1">
                                                        <User className="w-3 h-3" />
                                                        <span>{player.assists}</span>
                                                    </div>
                                                )}
                                                {player.points > 0 && (
                                                    <div className="flex items-center space-x-1">
                                                        <Hash className="w-3 h-3" />
                                                        <span>{player.points}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </m.div>
                                ))}
                            </div>
                        </m.div>
                    ))}
                </div>
            )}
        </div>
    )
}
