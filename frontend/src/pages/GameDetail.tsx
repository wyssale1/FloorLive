import { useParams, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { useState, useCallback, useMemo } from 'react'
import { calculateSeasonYear, getCurrentSeasonYear } from '../lib/seasonUtils'
import GameTimeline from '../components/GameTimeline'
import GameHeaderSkeleton from '../components/GameHeaderSkeleton'
import GameOverviewSkeleton from '../components/GameOverviewSkeleton'
import TeamLogo from '../components/TeamLogo'
import TabsContainer from '../components/TabsContainer'
import LeagueTable from '../components/LeagueTable'
import GameOverview from '../components/GameOverview'
import { PeriodBadge } from '../components/LiveBadge'
import { usePageTitle, pageTitles } from '../hooks/usePageTitle'
import { useMetaTags, generateGameMeta } from '../hooks/useMetaTags'
import { extractLeagueId } from '../lib/utils'
import { useLiveGamePolling, useRankings } from '../hooks/useQueries'
import { determineGameLiveStatus } from '../lib/liveGameUtils'

export default function GameDetail() {
  const { gameId } = useParams({ from: '/game/$gameId' })
  const [selectedSeason, setSelectedSeason] = useState<string>('')

  // Use React Query for game data and live polling
  const { game, events, isLoading: gameLoading } = useLiveGamePolling(gameId)

  // Calculate live status from fetched data
  const liveStatus = useMemo(() => {
    if (!game || !events) return {
      isLive: false,
      status: 'unknown' as const,
      homeScore: null,
      awayScore: null,
      currentPeriod: null,
      lastEventTime: null
    }
    return determineGameLiveStatus(game, events)
  }, [game, events])

  const isPolling = game?.status === 'live'
  

  // Calculate season for league table
  const gameSeason = useMemo(() => {
    if (!game) return getCurrentSeasonYear().toString()

    try {
      const dateToUse = game.gameDate
      if (dateToUse && typeof dateToUse === 'string' && !dateToUse.match(/^(heute|gestern|morgen|today|yesterday|tomorrow)$/i)) {
        return calculateSeasonYear(dateToUse).toString()
      }
    } catch {
      // Fallback to current season
    }
    return getCurrentSeasonYear().toString()
  }, [game])

  const targetSeason = selectedSeason || gameSeason
  const leagueId = useMemo(() => game ? extractLeagueId(game.league) : null, [game])

  // Use React Query for league table
  const {
    data: rankingsData,
    isLoading: rankingsLoading
  } = useRankings({
    season: targetSeason,
    league: leagueId || undefined,
    leagueName: game?.league?.name,
    teamNames: game ? [game.homeTeam?.name, game.awayTeam?.name].filter(Boolean) : undefined
  }, !!game && !!leagueId)

  // Transform rankings data to table format
  const leagueTable = useMemo(() => {
    if (!rankingsData || !game) return null

    return {
      leagueId: leagueId || 'general',
      leagueName: game.league?.name || 'League',
      season: targetSeason,
      standings: rankingsData.standings?.standings || [],
      homeTeamId: game.homeTeam?.id,
      awayTeamId: game.awayTeam?.id
    }
  }, [rankingsData, game, leagueId, targetSeason])

  // Season change handler
  const handleSeasonChange = useCallback((newSeason: string) => {
    setSelectedSeason(newSeason)
  }, [])


  // Generate available seasons (only past and current seasons)
  const availableSeasons = useCallback(() => {
    if (!game) return []

    const currentSeason = getCurrentSeasonYear()
    let gameSeason: number

    try {
      const dateToUse = game.gameDate
      if (dateToUse && typeof dateToUse === 'string' && !dateToUse.match(/^(heute|gestern|morgen|today|yesterday|tomorrow)$/i)) {
        gameSeason = calculateSeasonYear(dateToUse)
      } else {
        gameSeason = currentSeason
      }
    } catch {
      gameSeason = currentSeason
    }

    const seasons = []

    // Include seasons from 3 years ago to current season (no future seasons)
    const startYear = Math.min(gameSeason - 3, currentSeason - 3)
    const endYear = currentSeason // Only up to current season

    for (let year = endYear; year >= startYear; year--) {
      seasons.push(year.toString())
    }

    return seasons
  }, [game])

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

  if (gameLoading) {
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
                    size="medium" 
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
                    size="medium" 
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
                  
                  <GameTimeline events={events} />
                </div>
              )
            },
            {
              value: 'table',
              label: 'League Table',
              content: (
                <LeagueTable
                  table={leagueTable}
                  loading={rankingsLoading}
                  highlightTeamIds={leagueTable ? [leagueTable.homeTeamId, leagueTable.awayTeamId].filter(Boolean) : []}
                  availableSeasons={availableSeasons()}
                  onSeasonChange={handleSeasonChange}
                  seasonSelectorDisabled={rankingsLoading}
                />
              )
            }
          ]}
        />
      </div>
    </div>
  )
}