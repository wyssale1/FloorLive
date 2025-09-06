import { useParams, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { User, Hash, Trophy, Target, Clock, Home, ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiClient } from '../lib/apiClient'
import type { Player, PlayerStatistics, PlayerGamePerformance } from '../shared/types'
import { Skeleton } from '../components/ui/skeleton'
import TabsContainer from '../components/TabsContainer'
import PlayerImage from '../components/PlayerImage'
import { usePageTitle, pageTitles } from '../hooks/usePageTitle'
import { useMetaTags, generatePlayerMeta } from '../hooks/useMetaTags'

export default function PlayerDetail() {
  const { playerId } = useParams({ from: '/player/$playerId' })
  const [player, setPlayer] = useState<Player | null>(null)
  const [statistics, setStatistics] = useState<PlayerStatistics[]>([])
  const [overview, setOverview] = useState<PlayerGamePerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [tabsLoading, setTabsLoading] = useState({
    statistics: false,
    overview: false
  })

  useEffect(() => {
    const fetchPlayerData = async () => {
      setLoading(true)
      try {
        const playerData = await apiClient.getPlayerDetails(playerId)
        setPlayer(playerData)
        
        // Load statistics by default
        setTabsLoading(prev => ({ ...prev, statistics: true }))
        const statsData = await apiClient.getPlayerStatistics(playerId)
        setStatistics(statsData)
        setTabsLoading(prev => ({ ...prev, statistics: false }))
      } catch (error) {
        console.error('Error fetching player data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPlayerData()
  }, [playerId])

  // Set dynamic page title and meta tags when player data is loaded
  const pageTitle = player ? pageTitles.player(player.name) : 'Player Details'
  usePageTitle(pageTitle)

  const metaOptions = player ? generatePlayerMeta({
    playerName: player.name,
    team: player.club?.name,
    position: player.position,
    profileImage: player.profileImage
  }) : {
    title: 'Player Details',
    description: 'Swiss Unihockey player information on FloorLive',
    type: 'website' as const
  }
  useMetaTags(metaOptions)

  const loadOverview = async () => {
    if (overview.length > 0) return // Already loaded
    
    setTabsLoading(prev => ({ ...prev, overview: true }))
    try {
      const overviewData = await apiClient.getPlayerOverview(playerId)
      setOverview(overviewData)
    } catch (error) {
      console.error('Error fetching player overview:', error)
    } finally {
      setTabsLoading(prev => ({ ...prev, overview: false }))
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-6 max-w-7xl">
        {/* Header Skeleton */}
        <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 mb-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
        {/* Content Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Player Not Found</h1>
          <Link to="/" search={{ date: undefined }} className="text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-6 max-w-7xl">
      {/* Player Header */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white/50 backdrop-blur-sm rounded-lg p-4 sm:p-6 mb-6"
      >
        <div className="flex items-center gap-4 mb-4">
          {/* Player Image */}
          <PlayerImage 
            player={player} 
            size="medium" 
            className="flex-shrink-0"
          />
          
          {/* Player Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
              {player.name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              {player.number && (
                <span>#{player.number}</span>
              )}
              {player.position && (
                <span>{player.position}</span>
              )}
            </div>
            {player.club && (
              <span className="flex items-center gap-1 text-sm text-gray-600">
                <Home className="w-3 h-3" />
                {player.club.name}
              </span>
            )}
          </div>
        </div>

      </motion.div>

      {/* Player Content Tabs */}
      <div className="max-w-7xl mx-auto">
        <TabsContainer
          defaultValue="player-info"
          tabs={[
            {
              value: 'player-info',
              label: 'Player Info',
              content: (
                <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-3 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">Player Information</h2>
                  
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-md font-semibold text-gray-700 mb-3">Basic Information</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                        {player.number && (
                          <div>
                            <div className="text-gray-500 mb-1">Jersey Number</div>
                            <div className="font-medium">#{player.number}</div>
                          </div>
                        )}
                        {player.position && (
                          <div>
                            <div className="text-gray-500 mb-1">Position</div>
                            <div className="font-medium">{player.position}</div>
                          </div>
                        )}
                        {player.yearOfBirth && (
                          <div>
                            <div className="text-gray-500 mb-1">Year of Birth</div>
                            <div className="font-medium">{player.yearOfBirth}</div>
                          </div>
                        )}
                        {player.height && (
                          <div>
                            <div className="text-gray-500 mb-1">Height</div>
                            <div className="font-medium">{player.height}</div>
                          </div>
                        )}
                        {player.weight && (
                          <div>
                            <div className="text-gray-500 mb-1">Weight</div>
                            <div className="font-medium">{player.weight}</div>
                          </div>
                        )}
                        {player.shoots && (
                          <div>
                            <div className="text-gray-500 mb-1">Shoots</div>
                            <div className="font-medium">{player.shoots === 'L' ? 'Left' : 'Right'}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Current Season */}
                    {player.currentSeason && (
                      <div>
                        <h3 className="text-md font-semibold text-gray-700 mb-3">Current Season</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500 mb-1">League</div>
                            <div className="font-medium">{player.currentSeason.league}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1">Team</div>
                            <div className="font-medium">{player.currentSeason.team}</div>
                          </div>
                        </div>
                      </div>
                    )}


                    {/* Career Summary */}
                    {player.careerStats && (
                      <div>
                        <h3 className="text-md font-semibold text-gray-700 mb-3">Career Summary</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-gray-500 mb-1">Games Played</div>
                            <div className="font-bold text-lg">{player.careerStats.totalGames}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1">Goals</div>
                            <div className="font-bold text-lg">{player.careerStats.totalGoals}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1">Assists</div>
                            <div className="font-bold text-lg">{player.careerStats.totalAssists}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 mb-1">Points</div>
                            <div className="font-bold text-lg text-blue-600">{player.careerStats.totalPoints}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            },
            {
              value: 'statistics',
              label: 'Season Statistics',
              content: (
                <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-3 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-800 mb-4">Season Statistics</h2>
                  
                  {tabsLoading.statistics ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : statistics.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 text-gray-600">
                            <th className="text-left py-2 px-1">Season</th>
                            <th className="text-left py-2 px-1">League</th>
                            <th className="text-left py-2 px-1">Team</th>
                            <th className="text-center py-2 px-1">GP</th>
                            <th className="text-center py-2 px-1">G</th>
                            <th className="text-center py-2 px-1">A</th>
                            <th className="text-center py-2 px-1">PTS</th>
                            <th className="text-center py-2 px-1">PIM</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statistics.map((stat, index) => (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="py-3 px-1 font-medium">{stat.season}</td>
                              <td className="py-3 px-1 text-gray-600">{stat.league}</td>
                              <td className="py-3 px-1 text-gray-600">
                                {stat.teamId ? (
                                  <Link 
                                    to="/team/$teamId" 
                                    params={{ teamId: stat.teamId }}
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    {stat.team}
                                  </Link>
                                ) : (
                                  stat.team
                                )}
                              </td>
                              <td className="py-3 px-1 text-center">{stat.games}</td>
                              <td className="py-3 px-1 text-center font-medium">{stat.goals}</td>
                              <td className="py-3 px-1 text-center font-medium">{stat.assists}</td>
                              <td className="py-3 px-1 text-center font-bold">{stat.points}</td>
                              <td className="py-3 px-1 text-center text-gray-600">
                                {stat.penalties.twoMinute + stat.penalties.fiveMinute + stat.penalties.tenMinute}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <div className="text-gray-400 text-sm mb-1">No statistics available</div>
                      <div className="text-gray-500 text-xs">Player statistics will appear here once available</div>
                    </div>
                  )}
                </div>
              )
            },
            {
              value: 'overview',
              label: 'Game History',
              content: (
                <div
                  onFocus={() => loadOverview()}
                  onClick={() => loadOverview()}
                  className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-3 sm:p-6"
                >
                  <h2 className="text-lg font-medium text-gray-800 mb-4">Game Performance</h2>
                  
                  {tabsLoading.overview ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : overview.length > 0 ? (
                    <div className="space-y-3">
                      {overview.map((game, index) => (
                        <div key={index} className="border border-gray-100 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{game.gameDate}</span>
                              <span className="text-gray-500">{game.venue}</span>
                            </div>
                            <div className="text-sm text-gray-600">{game.gameScore}</div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              {game.homeTeamId ? (
                                <Link 
                                  to="/team/$teamId" 
                                  params={{ teamId: game.homeTeamId }}
                                  className="text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {game.homeTeam}
                                </Link>
                              ) : (
                                game.homeTeam
                              )}{' '}
                              vs{' '}
                              {game.awayTeamId ? (
                                <Link 
                                  to="/team/$teamId" 
                                  params={{ teamId: game.awayTeamId }}
                                  className="text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {game.awayTeam}
                                </Link>
                              ) : (
                                game.awayTeam
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3 text-gray-400" />
                                {game.playerGoals}G {game.playerAssists}A
                              </span>
                              <span className="font-medium">{game.playerPoints}PTS</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <div className="text-gray-400 text-sm mb-1">No game history available</div>
                      <div className="text-gray-500 text-xs">Game performance data will appear here once available</div>
                    </div>
                  )}
                </div>
              )
            }
          ]}
        />
      </div>
    </div>
  )
}