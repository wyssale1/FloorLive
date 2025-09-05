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
}


export default function GameCard({ game, className, showDate = false }: GameCardProps) {
  const isLive = game.status === 'live'
  const isUpcoming = game.status === 'upcoming'
  const hasScores = isLive || game.status === 'finished'
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-CH', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
  }

  const renderLeftContent = () => {
    if (isUpcoming) {
      return <span className="text-gray-700 font-medium text-sm">{game.startTime}</span>
    }
    if (hasScores) {
      return (
        <div className="space-y-1">
          <span className="text-sm font-medium text-gray-800 block">{game.homeScore}</span>
          <span className="text-sm font-medium text-gray-800 block">{game.awayScore}</span>
        </div>
      )
    }
    return null
  }

  const renderTeamLine = (team: any) => (
    <div className="flex items-center space-x-3">
      <TeamLogo 
        team={team} 
        size="small" 
        className="shrink-0"
        fallbackIcon={<Shield className="w-4 h-4 text-gray-400" />}
      />
      <span className="text-sm text-gray-700 font-medium truncate">
        {team.name}
      </span>
    </div>
  )

  return (
    <Link to="/game/$gameId" params={{ gameId: game.id }} className="block">
      <motion.div
        whileTap={{ scale: 0.995 }}
        className={cn(
          "p-3 hover:bg-gray-50 transition-all duration-200 touch-manipulation rounded-lg",
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
          <div className="flex-1 space-y-2">
            {renderTeamLine(game.homeTeam)}
            {renderTeamLine(game.awayTeam)}
          </div>
          
          {/* Date display if enabled */}
          {showDate && game.gameDate && (
            <div className="ml-3">
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