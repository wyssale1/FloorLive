import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import type { Game } from '../lib/mockData'
import { cn } from '../lib/utils'
import TeamLogo from './TeamLogo'

interface GameCardProps {
  game: Game
  className?: string
  showDate?: boolean
  noPaddingOnMobile?: boolean
  currentGameId?: string // For highlighting the currently viewed game
}


export default function GameCard({ game, className, showDate = false, noPaddingOnMobile = false, currentGameId }: GameCardProps) {
  const isLive = game.status === 'live'
  const isUpcoming = game.status === 'upcoming'
  const hasScores = isLive || game.status === 'finished'
  const isCurrentGame = currentGameId === game.id
  
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
    if (game.status !== 'finished' || game.homeScore === null || game.awayScore === null) return null
    if (game.homeScore > game.awayScore) return 'home'
    if (game.awayScore > game.homeScore) return 'away' 
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
    if (hasScores && (game.homeScore !== null || game.awayScore !== null)) {
      return (
        <div className="space-y-1">
          <span className={`text-sm text-gray-800 block ${winner === 'home' ? 'font-bold' : 'font-medium'}`}>
            {game.homeScore !== null ? game.homeScore : '0'}
          </span>
          <span className={`text-sm text-gray-800 block ${winner === 'away' ? 'font-bold' : 'font-medium'}`}>
            {game.awayScore !== null ? game.awayScore : '0'}
          </span>
        </div>
      )
    }
    return null
  }

  const renderTeamLine = (team: any, isHomeTeam: boolean) => {
    const isWinner = winner === (isHomeTeam ? 'home' : 'away')
    
    return (
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <TeamLogo 
          team={team} 
          size="small" 
          className="shrink-0"
          fallbackIcon={<Shield className="w-4 h-4 text-gray-400" />}
        />
        <span className={`text-sm text-gray-700 truncate ${isWinner ? 'font-bold' : 'font-medium'}`}>
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
          "hover:bg-gray-50 transition-all duration-200 touch-manipulation rounded-lg",
          noPaddingOnMobile ? "px-0 py-3 sm:p-3" : "p-3",
          isCurrentGame && "bg-blue-50/50",
          className
        )}
      >
        {/* Live indicator */}
        {isLive && (
          <div className="flex items-center justify-center space-x-1 mb-2">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-600 font-medium text-xs">LIVE</span>
          </div>
        )}
        
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
              <div className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600 font-medium">
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