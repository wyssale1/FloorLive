import { useParams, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiClient, type GameEvent } from '../lib/apiClient'
import GameTimeline from '../components/GameTimeline'
import TeamLogo from '../components/TeamLogo'
import TabsContainer from '../components/TabsContainer'
import LeagueTable from '../components/LeagueTable'
import GameStatistics from '../components/GameStatistics'

export default function GameDetail() {
  const { gameId } = useParams({ from: '/game/$gameId' })
  const [game, setGame] = useState<any>(null)
  const [events, setEvents] = useState<GameEvent[]>([])
  const [leagueTable, setLeagueTable] = useState<any>(null)
  const [gameStatistics, setGameStatistics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tabsLoading, setTabsLoading] = useState({
    events: false,
    table: false,
    statistics: false
  })
  
  useEffect(() => {
    const fetchGameData = async () => {
      setLoading(true)
      try {
        const gameData = await apiClient.getGameDetails(gameId)
        
        if (gameData) {
          const adaptedGame = apiClient.adaptGameForFrontend(gameData)
          setGame(adaptedGame)
          
          // Initial load of events (for default tab)
          setTabsLoading(prev => ({ ...prev, events: true }))
          const eventsData = await apiClient.getGameEvents(gameId)
          setEvents(eventsData)
          setTabsLoading(prev => ({ ...prev, events: false }))
        }
      } catch (error) {
        console.error('Error fetching game data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchGameData()
  }, [gameId])

  const loadLeagueTable = async (leagueId: string) => {
    if (leagueTable) return // Already loaded
    
    setTabsLoading(prev => ({ ...prev, table: true }))
    try {
      // Extract season from game date for historical rankings
      const gameYear = game?.gameDate ? new Date(game.gameDate).getFullYear() : new Date().getFullYear()
      const currentYear = new Date().getFullYear()
      
      // Use current season if game is from this year, otherwise use historical season
      const season = gameYear === currentYear ? undefined : gameYear.toString()
      
      const rankingsData = await apiClient.getRankings({ 
        season,
        league: leagueId 
      })
      setLeagueTable(rankingsData)
    } catch (error) {
      console.error('Error fetching league table:', error)
    } finally {
      setTabsLoading(prev => ({ ...prev, table: false }))
    }
  }

  const loadGameStatistics = async () => {
    if (gameStatistics) return // Already loaded
    
    setTabsLoading(prev => ({ ...prev, statistics: true }))
    try {
      const statsData = await apiClient.getGameStatistics(gameId)
      setGameStatistics(statsData)
    } catch (error) {
      console.error('Error fetching game statistics:', error)
    } finally {
      setTabsLoading(prev => ({ ...prev, statistics: false }))
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">Loading game details...</div>
        </div>
      </div>
    )
  }
  
  if (!game) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Game Not Found</h1>
          <Link to="/" search={{ date: undefined }} className="text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">

      {/* Team Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/50 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center flex-wrap gap-4 sm:gap-8 sm:flex-nowrap">
            {/* Home Team */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-2 sm:space-x-4 flex-1 sm:flex-none justify-center sm:justify-end"
            >
              <TeamLogo 
                team={game.homeTeam} 
                size="large" 
                className="w-12 h-12 sm:w-16 sm:h-16"
                showSwissUnihockeyFallback={true}
              />
              <div className="text-center sm:text-right">
                <Link 
                  to="/team/$teamId" 
                  params={{ teamId: game.homeTeam.id }}
                  className="text-base sm:text-xl font-medium text-gray-800 hover:text-gray-900 transition-colors"
                >
                  {game.homeTeam.name}
                </Link>
              </div>
            </motion.div>

            {/* Score */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="mx-4 sm:mx-8 text-center order-first sm:order-none w-full sm:w-auto"
            >
              <div className="text-3xl sm:text-5xl font-medium text-gray-800 mb-2">
                {game.homeScore} - {game.awayScore}
              </div>
              
              {/* Status indicators */}
              <div className="flex items-center justify-center space-x-2 mb-2">
                {game.status === 'live' && (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  </>
                )}
                {game.status === 'today' && (
                  <>
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  </>
                )}
                {game.status === 'recent' && (
                  <>
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  </>
                )}
              </div>

              {game.period && (
                <div className="text-sm text-gray-600 mb-1">{game.period}</div>
              )}
              
              {game.startTime && (
                <div className="text-sm text-gray-600">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {game.startTime}
                </div>
              )}
              
              {game.gameDate && (
                <div className="text-xs text-gray-500 mt-1">
                  {game.gameDate}
                </div>
              )}
            </motion.div>

            {/* Away Team */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-2 sm:space-x-4 flex-1 sm:flex-none justify-center sm:justify-start"
            >
              <div className="text-center sm:text-left">
                <Link 
                  to="/team/$teamId" 
                  params={{ teamId: game.awayTeam.id }}
                  className="text-base sm:text-xl font-medium text-gray-800 hover:text-gray-900 transition-colors"
                >
                  {game.awayTeam.name}
                </Link>
              </div>
              <TeamLogo 
                team={game.awayTeam} 
                size="large" 
                className="w-12 h-12 sm:w-16 sm:h-16"
                showSwissUnihockeyFallback={true}
              />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Game Status Banner */}
      {game.status === 'live' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-red-500 text-white text-center py-2"
        >
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-medium">Live Game</span>
          </div>
        </motion.div>
      )}

      {/* Game Content Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <TabsContainer
          defaultValue="events"
          tabs={[
            {
              value: 'events',
              label: 'Events',
              content: (
                <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-medium text-gray-800">Game Timeline</h2>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Live updates</span>
                    </div>
                  </div>
                  
                  {tabsLoading.events ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-sm">Loading events...</div>
                    </div>
                  ) : (
                    <GameTimeline events={events} />
                  )}
                </div>
              )
            },
            {
              value: 'table',
              label: 'League Table',
              content: (
                <div
                  onFocus={() => game?.league?.id && loadLeagueTable(game.league.id)}
                  onClick={() => game?.league?.id && loadLeagueTable(game.league.id)}
                >
                  <LeagueTable 
                    table={leagueTable} 
                    loading={tabsLoading.table}
                  />
                </div>
              ),
              disabled: !game?.league?.id
            },
            {
              value: 'statistics',
              label: 'Statistics',
              content: (
                <div
                  onFocus={() => loadGameStatistics()}
                  onClick={() => loadGameStatistics()}
                >
                  <GameStatistics
                    statistics={gameStatistics}
                    homeTeam={game?.homeTeam || { name: 'Home Team' }}
                    awayTeam={game?.awayTeam || { name: 'Away Team' }}
                    loading={tabsLoading.statistics}
                  />
                </div>
              )
            }
          ]}
        />
      </div>
    </div>
  )
}