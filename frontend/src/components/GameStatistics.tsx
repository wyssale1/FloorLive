import { motion } from 'framer-motion'
import { BarChart3, User, Target, Hash, Clock } from 'lucide-react'
import type { GameStatisticsData, GamePlayerStats } from '../shared/types'

interface GameStatisticsProps {
  statistics: GameStatisticsData | null
  homeTeam: { name: string }
  awayTeam: { name: string }
  loading?: boolean
}

export default function GameStatistics({ statistics, homeTeam, awayTeam, loading }: GameStatisticsProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-sm">Loading game statistics...</div>
      </div>
    )
  }

  if (!statistics) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-sm mb-2">Game statistics not available</div>
        <div className="text-gray-500 text-xs">
          Detailed statistics may not be available for this game.
        </div>
      </div>
    )
  }

  const hasTeamStats = Object.keys(statistics.teamStats.home).length > 0 || Object.keys(statistics.teamStats.away).length > 0
  const hasPlayerStats = statistics.playerStats.home.length > 0 || statistics.playerStats.away.length > 0

  return (
    <div className="space-y-6">
      {/* Team Statistics */}
      {hasTeamStats && (
        <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-4 h-4 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-800">Team Statistics</h3>
          </div>

          <div className="space-y-3">
            {Object.keys(statistics.teamStats.home).map((statName, index) => {
              const homeValue = statistics.teamStats.home[statName]
              const awayValue = statistics.teamStats.away[statName]

              return (
                <motion.div
                  key={statName}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="grid grid-cols-5 gap-4 items-center p-3 bg-white/40 rounded-lg border border-gray-100"
                >
                  <div className="col-span-1 text-sm font-medium text-gray-700 text-right">
                    {homeValue}
                  </div>
                  <div className="col-span-3 text-center">
                    <div className="text-sm text-gray-600">{statName}</div>
                  </div>
                  <div className="col-span-1 text-sm font-medium text-gray-700 text-left">
                    {awayValue}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Player Statistics */}
      {hasPlayerStats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Home Team Players */}
          {statistics.playerStats.home.length > 0 && (
            <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <User className="w-4 h-4 text-gray-600" />
                <h3 className="text-lg font-medium text-gray-800">{homeTeam.name}</h3>
                <span className="text-sm text-gray-500">
                  {statistics.playerStats.home.length} players
                </span>
              </div>

              <div className="space-y-2">
                {statistics.playerStats.home.map((player: GamePlayerStats, index: number) => (
                  <motion.div
                    key={`${player.number}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="flex items-center justify-between p-3 bg-white/40 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      {player.number && (
                        <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full">
                          <span className="text-xs font-medium text-gray-700">
                            {player.number}
                          </span>
                        </div>
                      )}
                      <div className="text-sm font-medium text-gray-800">
                        {player.name}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      {player.goals > 0 && (
                        <div className="flex items-center space-x-1">
                          <Target className="w-3 h-3" />
                          <span>{player.goals}</span>
                        </div>
                      )}
                      {player.assists > 0 && (
                        <div className="flex items-center space-x-1">
                          <Hash className="w-3 h-3" />
                          <span>{player.assists}</span>
                        </div>
                      )}
                      {player.playingTime && player.playingTime !== '0:00' && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{player.playingTime}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Away Team Players */}
          {statistics.playerStats.away.length > 0 && (
            <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <User className="w-4 h-4 text-gray-600" />
                <h3 className="text-lg font-medium text-gray-800">{awayTeam.name}</h3>
                <span className="text-sm text-gray-500">
                  {statistics.playerStats.away.length} players
                </span>
              </div>

              <div className="space-y-2">
                {statistics.playerStats.away.map((player: GamePlayerStats, index: number) => (
                  <motion.div
                    key={`${player.number}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="flex items-center justify-between p-3 bg-white/40 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      {player.number && (
                        <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full">
                          <span className="text-xs font-medium text-gray-700">
                            {player.number}
                          </span>
                        </div>
                      )}
                      <div className="text-sm font-medium text-gray-800">
                        {player.name}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      {player.goals > 0 && (
                        <div className="flex items-center space-x-1">
                          <Target className="w-3 h-3" />
                          <span>{player.goals}</span>
                        </div>
                      )}
                      {player.assists > 0 && (
                        <div className="flex items-center space-x-1">
                          <Hash className="w-3 h-3" />
                          <span>{player.assists}</span>
                        </div>
                      )}
                      {player.playingTime && player.playingTime !== '0:00' && (
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{player.playingTime}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!hasTeamStats && !hasPlayerStats && (
        <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-12 text-center">
          <div className="text-gray-400 text-sm mb-2">No detailed statistics available</div>
          <div className="text-gray-500 text-xs">
            Player and team statistics may be available after the game is completed.
          </div>
        </div>
      )}
    </div>
  )
}