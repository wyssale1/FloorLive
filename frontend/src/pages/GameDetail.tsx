import { useParams, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { apiClient, type GameEvent } from '../lib/apiClient'
import GameTimeline from '../components/GameTimeline'
import GameTimelineSkeleton from '../components/GameTimelineSkeleton'
import GameHeaderSkeleton from '../components/GameHeaderSkeleton'
import GameOverviewSkeleton from '../components/GameOverviewSkeleton'
import TeamLogo from '../components/TeamLogo'
import TabsContainer from '../components/TabsContainer'
import LeagueTable from '../components/LeagueTable'
import GameOverview from '../components/GameOverview'
import LiveBadge, { PeriodBadge } from '../components/LiveBadge'
import { useLiveGame } from '../hooks/useLiveGame'
import { usePageTitle, pageTitles } from '../hooks/usePageTitle'
import { useMetaTags, generateGameMeta } from '../hooks/useMetaTags'
import { extractLeagueId } from '../lib/utils'

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

  // Live game detection and polling
  const { liveStatus, isPolling } = useLiveGame({
    gameId,
    initialGame: game,
    initialEvents: events,
    enabled: true
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

  const loadLeagueTable = useCallback(async () => {
    if (leagueTable || !game) return // Already loaded or no game data
    
    setTabsLoading(prev => ({ ...prev, table: true }))
    try {
      // Use hardcoded 2024 for testing since 2025 rankings are not available yet
      const season = "2024"
      const leagueId = extractLeagueId(game.league)
      
      if (!leagueId) {
        console.warn('No league information available for game:', game.league)
        setTabsLoading(prev => ({ ...prev, table: false }))
        return
      }
      
      console.log('Loading league table with season:', season, 'league:', leagueId, 'from game league:', game.league)
      
      // Use existing rankings API that's known to work: /leagues/rankings?season=2024&league=L-UPL
      const rankingsData = await apiClient.getRankings({
        season: season,
        league: leagueId,
        leagueName: game.league?.name, // Pass league name for gender detection
        teamNames: [game.homeTeam?.name, game.awayTeam?.name].filter(Boolean) // Pass team names for additional gender context
      })
      
      if (rankingsData) {
        setLeagueTable({
          leagueId: leagueId,
          leagueName: game.league?.name || 'League',
          season: season,
          standings: rankingsData.standings?.standings || [],
          homeTeamId: game.homeTeam?.id,
          awayTeamId: game.awayTeam?.id,
        })
      }
    } catch (error) {
      console.error('Error fetching league table:', error)
    } finally {
      setTabsLoading(prev => ({ ...prev, table: false }))
    }
  }, [game, leagueTable])

  // Auto-load league table when game data is available (same pattern as events)
  useEffect(() => {
    if (game && !leagueTable) {
      loadLeagueTable()
    }
  }, [game, leagueTable, loadLeagueTable])

  // Set dynamic page title and meta tags when game data is loaded
  const pageTitle = game 
    ? pageTitles.game(game.homeTeam?.name || 'Team', game.awayTeam?.name || 'Team', game.status)
    : 'Game Details'
  usePageTitle(pageTitle)

  const metaOptions = game ? generateGameMeta({
    homeTeam: game.homeTeam?.name || 'Team',
    awayTeam: game.awayTeam?.name || 'Team', 
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    status: game.status,
    startTime: game.startTime,
    gameDate: game.gameDate
  }) : {
    title: 'Game Details',
    description: 'Swiss Unihockey game information on FloorLive',
    type: 'website' as const
  }
  useMetaTags(metaOptions)

  if (loading) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-6 max-w-7xl">
        {/* Game Header Skeleton */}
        <GameHeaderSkeleton />

        {/* Game Content Tabs Skeleton */}
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
          <GameOverviewSkeleton />
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
          <div className="flex items-start justify-between gap-3 sm:gap-6">
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
                <div className="mb-3 flex-shrink-0">
                  <TeamLogo 
                    team={game.homeTeam} 
                    size="large" 
                    variant="square"
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
              className="text-center flex-shrink-0 flex flex-col"
            >
              {/* Live Badge */}
              {liveStatus.isLive && (
                <div className="mb-3">
                  <LiveBadge liveStatus={liveStatus} variant="default" />
                </div>
              )}

              {/* Score/Status - aligned with team names */}
              <div className="mt-12 mb-3">
                {game.status === 'upcoming' ? (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    Upcoming
                  </span>
                ) : (
                  <div className="text-xl sm:text-3xl text-gray-800">
                    {(() => {
                      // For live games, use live scores; for finished games, prefer original scores
                      let homeScoreValue, awayScoreValue
                      
                      if (liveStatus.isLive) {
                        // Live game: use live scores if available, fallback to game scores
                        homeScoreValue = liveStatus.homeScore !== null ? liveStatus.homeScore : 
                          (game.homeScore !== null && game.homeScore !== undefined ? Number(game.homeScore) : null)
                        awayScoreValue = liveStatus.awayScore !== null ? liveStatus.awayScore : 
                          (game.awayScore !== null && game.awayScore !== undefined ? Number(game.awayScore) : null)
                      } else {
                        // Finished/non-live game: use original game scores first, then live scores as fallback
                        homeScoreValue = (game.homeScore !== null && game.homeScore !== undefined ? Number(game.homeScore) : 
                          (liveStatus.homeScore !== null ? liveStatus.homeScore : null))
                        awayScoreValue = (game.awayScore !== null && game.awayScore !== undefined ? Number(game.awayScore) : 
                          (liveStatus.awayScore !== null ? liveStatus.awayScore : null))
                      }
                      
                      const homeScore = homeScoreValue !== null && !isNaN(homeScoreValue) ? homeScoreValue : '-'
                      const awayScore = awayScoreValue !== null && !isNaN(awayScoreValue) ? awayScoreValue : '-'
                      
                      const hasScores = homeScoreValue !== null && awayScoreValue !== null && !isNaN(homeScoreValue) && !isNaN(awayScoreValue)
                      const homeWins = hasScores && homeScoreValue !== null && awayScoreValue !== null && homeScoreValue > awayScoreValue
                      const awayWins = hasScores && homeScoreValue !== null && awayScoreValue !== null && awayScoreValue > homeScoreValue
                      
                      return (
                        <>
                          <span className={homeWins ? 'font-bold' : 'font-medium'}>{homeScore}</span>
                          <span className="font-medium"> - </span>
                          <span className={awayWins ? 'font-bold' : 'font-medium'}>{awayScore}</span>
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>

              {/* Period Badge */}
              {liveStatus.currentPeriod && (
                <div className="mb-2">
                  <PeriodBadge 
                    period={liveStatus.currentPeriod} 
                    isIntermission={liveStatus.status === 'intermission'} 
                    variant="compact"
                  />
                </div>
              )}
              
              {/* Additional information below */}
              <div className="space-y-1">
                {/* Polling indicator for live games */}
                {isPolling && (
                  <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-3 h-3 border border-gray-400 border-t-blue-500 rounded-full"
                    />
                    <span>Live updates</span>
                  </div>
                )}
                
                {game.startTime && !liveStatus.isLive && (
                  <div className="text-xs text-gray-600">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {game.startTime}
                  </div>
                )}
                
                {game.gameDate && (
                  <div className="text-2xs text-gray-500">
                    {game.gameDate}
                  </div>
                )}

                {liveStatus.lastEventTime && liveStatus.isLive && (
                  <div className="text-xs text-gray-500">
                    Last event: {liveStatus.lastEventTime}
                  </div>
                )}
              </div>
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
                <div className="mb-3 flex-shrink-0">
                  <TeamLogo 
                    team={game.awayTeam} 
                    size="large" 
                    variant="square"
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
                    {game.status === 'live' && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Live updates</span>
                      </div>
                    )}
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
                <LeagueTable 
                  table={leagueTable} 
                  loading={tabsLoading.table}
                  highlightTeamIds={leagueTable ? [leagueTable.homeTeamId, leagueTable.awayTeamId].filter(Boolean) : []}
                />
              )
            }
          ]}
        />
      </div>
    </div>
  )
}