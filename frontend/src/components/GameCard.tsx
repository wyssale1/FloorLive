import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import type { Game } from '../lib/mockData'
import { cn } from '../lib/utils'
import { determineGameLiveStatus, shouldPollGameForUpdates, type LiveGameStatus } from '../lib/liveGameUtils'
import { apiClient } from '../lib/apiClient'
import TeamLogo from './TeamLogo'
import LiveBadge from './LiveBadge'

interface GameCardProps {
  game: Game
  className?: string
  showDate?: boolean
  noPaddingOnMobile?: boolean
  currentGameId?: string // For highlighting the currently viewed game
}


export default function GameCard({ game, className, showDate = false, noPaddingOnMobile = false, currentGameId }: GameCardProps) {
  const [liveStatus, setLiveStatus] = useState<LiveGameStatus>(() => 
    determineGameLiveStatus(game, [])
  )

  // Check for live status on mount and when game changes
  useEffect(() => {
    const checkLiveStatus = async () => {
      try {
        console.log(`=== GAMECARD FLOW for ${game.homeTeam?.name} vs ${game.awayTeam?.name} ===`)
        const initialStatus = determineGameLiveStatus(game, [])
        console.log('1. Initial status (no events):', initialStatus)
        console.log('2. shouldPollGameForUpdates:', shouldPollGameForUpdates(initialStatus))
        console.log('3. initialStatus.status === "live":', initialStatus.status === 'live')
        
        // If game might be live, fetch events for accurate detection
        if (shouldPollGameForUpdates(initialStatus) || initialStatus.status === 'live') {
          console.log('4. Fetching events for game...')
          try {
            const events = await apiClient.getGameEvents(game.id)
            console.log('5. Retrieved events:', events.length)
            const liveStatusWithEvents = determineGameLiveStatus(game, events)
            console.log('6. Final status (with events):', liveStatusWithEvents)
            setLiveStatus(liveStatusWithEvents)
          } catch (error) {
            console.error('Error checking live status for game', game.id, error)
            console.log('7. Using initial status due to error')
            setLiveStatus(initialStatus)
          }
        } else {
          console.log('4. Using initial status (not polling)')
          setLiveStatus(initialStatus)
        }
        console.log(`=== END GAMECARD FLOW ===`)
      } catch (error) {
        console.error('Error determining live status:', error)
      }
    }

    checkLiveStatus()
  }, [game.id, game.startTime, game.gameDate])

  const isLive = liveStatus.isLive
  const isUpcoming = game.status === 'upcoming'
  const hasScores = isLive || game.status === 'finished' || (game.homeScore !== null || game.awayScore !== null) || (liveStatus.homeScore !== null || liveStatus.awayScore !== null)
  const isCurrentGame = currentGameId === game.id
  
  // Debug logging
  console.log(`GameCard for ${game.homeTeam?.name} vs ${game.awayTeam?.name}:`)
  console.log(`- isLive: ${isLive}`)
  console.log(`- liveStatus:`, liveStatus)
  console.log(`- hasScores: ${hasScores}`)
  console.log(`- game.homeScore: ${game.homeScore}, game.awayScore: ${game.awayScore}`)
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-CH', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
  }

  // Determine winner for finished games
  const getWinner = () => {
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
  }
  
  const winner = getWinner()

  const renderLeftContent = () => {
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
  }

  const renderTeamLine = (team: any, isHomeTeam: boolean) => {
    const isWinner = winner === (isHomeTeam ? 'home' : 'away')
    const isLoser = winner !== null && !isWinner

    // For upcoming games, use isCurrentTeam flag instead of winner/loser
    let teamStyle = 'text-gray-700 font-medium' // default
    if (isUpcoming) {
      teamStyle = team.isCurrentTeam ? 'text-gray-800 font-bold' : 'text-gray-500 font-medium'
    } else {
      teamStyle = isWinner ? 'text-gray-800 font-bold' : isLoser ? 'text-gray-500 font-medium' : 'text-gray-700 font-medium'
    }

    return (
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <TeamLogo
          team={team}
          size="small"
          className="shrink-0"
          fallbackIcon={<Shield className="w-4 h-4 text-gray-400" />}
        />
        <span className={`text-sm truncate ${teamStyle}`}>
          {team.name}
        </span>
      </div>
    )
  }

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
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                isCurrentGame 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {formatDate(game.gameDate)}
              </div>
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