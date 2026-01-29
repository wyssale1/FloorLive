import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import { memo, useMemo, useCallback } from 'react'
import type { Game } from '../lib/mockData'
import { cn, formatSwissDate } from '../lib/utils'
import { determineGameLiveStatus, shouldPollGameForUpdates } from '../lib/liveGameUtils'
import { useGameEvents, useLiveGameDetail } from '../hooks/useQueries'
import { useGameLogos } from '../hooks/useGameLogos'
import TeamLogo from './TeamLogo'
import LiveBadge from './LiveBadge'
import PlayerStatsIcons from './PlayerStatsIcons'

interface PlayerPerformance {
  goals: number
  assists: number
  points: number
}

interface GameCardProps {
  game: Game
  className?: string
  showDate?: boolean
  noPaddingOnMobile?: boolean
  currentGameId?: string // For highlighting the currently viewed game
  playerPerformance?: PlayerPerformance // For showing player stats in player history
}

function GameCard({ game, className, showDate = false, noPaddingOnMobile = false, currentGameId, playerPerformance }: GameCardProps) {
  // Check if we should fetch events for live detection
  const shouldFetchEvents = useMemo(() => {
    const initialStatus = determineGameLiveStatus(game, [])
    return shouldPollGameForUpdates(initialStatus) || initialStatus.status === 'live'
  }, [game])

  // Only fetch events if the game might be live
  const { data: events = [] } = useGameEvents(game.id, shouldFetchEvents)

  // Check if potentially live for game details fetching
  const isPotentiallyLive = useMemo(() => {
    const initialStatus = determineGameLiveStatus(game, events)
    return initialStatus.status === 'live'
  }, [game, events])

  // Fetch live game details if potentially live (for accurate live scores)
  const { data: liveGameDetails } = useLiveGameDetail(game.id, isPotentiallyLive, shouldFetchEvents)

  // Calculate live status with events and live game details
  const liveStatus = useMemo(() => {
    return determineGameLiveStatus(game, events, liveGameDetails)
  }, [game, events, liveGameDetails])

  // Lazy-load team logos from game details API
  const { homeLogo, awayLogo } = useGameLogos(
    game.id,
    game.homeTeam.logo,
    game.awayTeam.logo
  );

  // Memoize computed values
  const { isLive, isUpcoming, hasScores, isCurrentGame } = useMemo(() => ({
    isLive: liveStatus.isLive,
    isUpcoming: game.status === 'upcoming',
    hasScores: liveStatus.isLive || game.status === 'finished' || (game.homeScore !== null || game.awayScore !== null) || (liveStatus.homeScore !== null || liveStatus.awayScore !== null),
    isCurrentGame: currentGameId === game.id
  }), [liveStatus.isLive, game.status, game.homeScore, game.awayScore, liveStatus.homeScore, liveStatus.awayScore, currentGameId, game.id])

  // Determine winner for finished games (memoized)
  const winner = useMemo(() => {
    let homeScore, awayScore

    if (isLive) {
      // For live games, prefer live scores
      homeScore = liveStatus.homeScore !== null ? liveStatus.homeScore : game.homeScore
      awayScore = liveStatus.awayScore !== null ? liveStatus.awayScore : game.awayScore
    } else {
      // For finished games, use original game scores first
      homeScore = game.homeScore !== null ? game.homeScore : liveStatus.homeScore
      awayScore = game.awayScore !== null ? game.awayScore : liveStatus.awayScore
    }

    if (game.status === 'upcoming' || homeScore === null || awayScore === null) return null
    if (homeScore > awayScore) return 'home'
    if (awayScore > homeScore) return 'away'
    return null // tie
  }, [isLive, liveStatus.homeScore, liveStatus.awayScore, game.homeScore, game.awayScore, game.status])

  const renderLeftContent = useCallback(() => {
    if (isUpcoming) {
      return (
        <div className="flex flex-col items-center">
          <span className="text-gray-700 font-medium text-sm">{game.startTime}</span>
        </div>
      )
    }
    if (hasScores) {
      let homeScore, awayScore

      if (isLive) {
        // For live games, prefer live scores
        homeScore = liveStatus.homeScore !== null ? liveStatus.homeScore : game.homeScore
        awayScore = liveStatus.awayScore !== null ? liveStatus.awayScore : game.awayScore
      } else {
        // For finished games, use original game scores first
        homeScore = game.homeScore !== null ? game.homeScore : liveStatus.homeScore
        awayScore = game.awayScore !== null ? game.awayScore : liveStatus.awayScore
      }

      return (
        <div className={`flex items-center ${isLive ? 'space-x-2' : 'justify-center'}`}>
          <div className="space-y-1">
            <span className={`text-sm block text-center ${winner === 'home' ? 'text-gray-800 font-bold' : winner === 'away' ? 'text-gray-500 font-medium' : 'text-gray-800 font-medium'}`}>
              {homeScore !== null ? homeScore : '-'}
            </span>
            <span className={`text-sm block text-center ${winner === 'away' ? 'text-gray-800 font-bold' : winner === 'home' ? 'text-gray-500 font-medium' : 'text-gray-800 font-medium'}`}>
              {awayScore !== null ? awayScore : '-'}
            </span>
          </div>
          {/* Live indicator next to score - only for live games */}
          {isLive && (
            <div className="flex items-center">
              <LiveBadge liveStatus={liveStatus} variant="dot-only" />
            </div>
          )}
        </div>
      )
    }
    return null
  }, [isUpcoming, game.startTime, hasScores, isLive, game.homeScore, game.awayScore, winner, liveStatus])

  const renderTeamLine = useCallback((team: { id: string; name: string; shortName?: string; logo?: string; isCurrentTeam?: boolean }, isHomeTeam: boolean) => {
    const isWinner = winner === (isHomeTeam ? 'home' : 'away')
    const isLoser = winner !== null && !isWinner

    // For upcoming games, use isCurrentTeam flag instead of winner/loser
    let teamStyle = 'text-gray-700 font-medium' // default
    if (isUpcoming) {
      teamStyle = team.isCurrentTeam ? 'text-gray-800 font-bold' : 'text-gray-500 font-medium'
    } else {
      teamStyle = isWinner ? 'text-gray-800 font-bold' : isLoser ? 'text-gray-500 font-medium' : 'text-gray-700 font-medium'
    }

    // Use lazy-loaded logo from game details
    const lazyLogo = isHomeTeam ? homeLogo : awayLogo;
    const teamWithLogo = { ...team, logo: team.logo || lazyLogo || undefined };

    return (
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <TeamLogo
          team={teamWithLogo}
          size="tiny"
          className="shrink-0"
          fallbackIcon={<Shield className="w-4 h-4 text-gray-400" />}
          showSwissUnihockeyFallback={true}
        />
        <span className={`text-sm truncate ${teamStyle}`}>
          {team.name}
        </span>
      </div>
    )
  }, [winner, isUpcoming, homeLogo, awayLogo])

  return (
    <Link to="/game/$gameId" params={{ gameId: game.id }} className="block">
      <motion.div
        whileTap={{ scale: 0.995 }}
        className={cn(
          "hover:bg-gray-50 transition-all duration-200 touch-manipulation rounded-lg relative",
          noPaddingOnMobile ? "pl-0 pr-2 py-3 sm:p-3" : "p-3",
          isCurrentGame && "bg-blue-50/50",
          className
        )}
      >

        {/* Main content */}
        <div className="flex items-center">
          {/* Left side - Always present for consistent height */}
          <div className="min-w-[40px] text-center mr-3">
            {renderLeftContent()}
          </div>

          {/* Teams */}
          <div className="flex-1 min-w-0 space-y-2">
            {renderTeamLine(game.homeTeam, true)}
            {renderTeamLine(game.awayTeam, false)}
          </div>

          {/* Date display if enabled */}
          {showDate && game.gameDate && (
            <div className="ml-3 flex-shrink-0">
              <div className={`px-2 py-1 rounded text-xs font-medium ${isCurrentGame
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
                }`}>
                {formatSwissDate(game.gameDate)}
              </div>
              {/* Player performance stats next to date */}
              {playerPerformance && (
                <div className="mt-1">
                  <PlayerStatsIcons
                    goals={playerPerformance.goals}
                    assists={playerPerformance.assists}
                    points={playerPerformance.points}
                    size="small"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Period and time info if available */}
        {(game.period || (isLive && game.time)) && (
          <div className="text-center mt-2">
            {game.period && (
              <span className="text-xs text-gray-400">{game.period}</span>
            )}
            {isLive && game.time && (
              <span className="text-xs text-gray-500 ml-2">({game.time})</span>
            )}
          </div>
        )}
      </motion.div>
    </Link>
  )
}

// Memoize the component to prevent unnecessary re-renders
export default memo(GameCard)