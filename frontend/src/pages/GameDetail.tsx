import { useParams, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiClient, type GameEvent } from '../lib/apiClient'
import GameTimeline from '../components/GameTimeline'
import GameTimelineSkeleton from '../components/GameTimelineSkeleton'
import GameHeaderSkeleton from '../components/GameHeaderSkeleton'
import TeamLogo from '../components/TeamLogo'
import TabsContainer from '../components/TabsContainer'
import LeagueTable from '../components/LeagueTable'
import GameOverview from '../components/GameOverview'

export default function GameDetail() {
  const { gameId } = useParams({ from: '/game/$gameId' })
  const [game, setGame] = useState<any>(null)
  const [events, setEvents] = useState<GameEvent[]>([])
  const [leagueTable, setLeagueTable] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tabsLoading, setTabsLoading] = useState({
    events: false,
    table: false
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

  
  if (loading) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-6 max-w-7xl">
        {/* Game Header Skeleton */}
        <GameHeaderSkeleton />

        {/* Game Content Tabs Skeleton */}
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-3 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-6">
              <div className="h-5 w-28 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <GameTimelineSkeleton />
          </div>
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
    <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-6 max-w-7xl" data-game-date={game?.gameDate}>

      {/* Team Header */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white/50 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <div className="flex items-center justify-between gap-3 sm:gap-6">
            {/* Home Team */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col items-center text-center flex-1"
            >
              <Link 
                to="/team/$teamId" 
                params={{ teamId: game.homeTeam.id }}
                className="flex flex-col items-center text-center hover:opacity-90 transition-opacity"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center mb-3 flex-shrink-0">
                  <TeamLogo 
                    team={game.homeTeam} 
                    size="large" 
                    className="w-10 h-10 sm:w-12 sm:h-12"
                    showSwissUnihockeyFallback={true}
                  />
                </div>
                <div className="w-full min-w-0">
                  <span className="text-sm sm:text-base font-medium text-gray-700 hover:text-gray-900 transition-colors block leading-tight hyphens-auto line-clamp-2"
                    style={{ wordBreak: 'break-word', hyphens: 'auto' }}
                  >
                    {game.homeTeam.name}
                  </span>
                </div>
              </Link>
            </motion.div>

            {/* Score */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-center flex-shrink-0"
            >
              <div className="text-xl sm:text-3xl font-medium text-gray-800 mb-1">
                {game.homeScore} - {game.awayScore}
              </div>
              
              {/* Status indicators */}
              <div className="flex items-center justify-center space-x-1 mb-1">
                {game.status === 'live' && (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  </>
                )}
                {game.status === 'today' && (
                  <>
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  </>
                )}
                {game.status === 'recent' && (
                  <>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </>
                )}
              </div>

              {game.period && (
                <div className="text-xs text-gray-600 mb-1">{game.period}</div>
              )}
              
              {game.startTime && (
                <div className="text-xs text-gray-600">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {game.startTime}
                </div>
              )}
              
              {game.gameDate && (
                <div className="text-2xs text-gray-500 mt-1">
                  {game.gameDate}
                </div>
              )}
            </motion.div>

            {/* Away Team */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col items-center text-center flex-1"
            >
              <Link 
                to="/team/$teamId" 
                params={{ teamId: game.awayTeam.id }}
                className="flex flex-col items-center text-center hover:opacity-90 transition-opacity"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center mb-3 flex-shrink-0">
                  <TeamLogo 
                    team={game.awayTeam} 
                    size="large" 
                    className="w-10 h-10 sm:w-12 sm:h-12"
                    showSwissUnihockeyFallback={true}
                  />
                </div>
                <div className="w-full min-w-0">
                  <span className="text-sm sm:text-base font-medium text-gray-700 hover:text-gray-900 transition-colors block leading-tight hyphens-auto line-clamp-2"
                    style={{ wordBreak: 'break-word', hyphens: 'auto' }}
                  >
                    {game.awayTeam.name}
                  </span>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Game Status Banner */}
      {game.status === 'live' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-red-500 text-white text-center py-2"
        >
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-medium">Live Game</span>
          </div>
        </motion.div>
      )}

      {/* Game Content Tabs */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <TabsContainer
          defaultValue="overview"
          tabs={[
            {
              value: 'overview',
              label: 'Game Info',
              content: (
                <GameOverview 
                  game={game}
                  gameId={gameId}
                />
              )
            },
            {
              value: 'events',
              label: 'Events',
              disabled: game.status === 'upcoming',
              content: (
                <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-3 sm:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-6">
                    <h2 className="text-lg font-medium text-gray-800">Game Timeline</h2>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Live updates</span>
                    </div>
                  </div>
                  
                  {tabsLoading.events ? (
                    <GameTimelineSkeleton />
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
            }
          ]}
        />
      </div>
    </div>
  )
}