import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import type { Game } from '../lib/mockData'
import { cn } from '../lib/utils'

interface GameCardProps {
  game: Game
  className?: string
}

// Team logo placeholder component
const TeamLogo = ({ team }: { team: { logo: string; name: string } }) => (
  <div className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded text-xs shrink-0">
    {team.logo}
  </div>
)

export default function GameCard({ game, className }: GameCardProps) {
  const isLive = game.status === 'live'
  const isUpcoming = game.status === 'upcoming'
  const isFinished = game.status === 'finished'

  const renderTimeOrResult = () => {
    if (isLive) {
      return (
        <div className="flex items-center space-x-1 min-w-[60px]">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-red-600 font-medium text-sm">
            {game.homeScore}-{game.awayScore}
          </span>
        </div>
      )
    } else if (isUpcoming) {
      return (
        <div className="min-w-[60px]">
          <span className="text-gray-700 font-medium text-sm">{game.startTime}</span>
        </div>
      )
    } else if (isFinished) {
      return (
        <div className="min-w-[60px]">
          <span className="text-gray-800 font-medium text-sm">
            {game.homeScore}-{game.awayScore}
          </span>
        </div>
      )
    }
  }

  return (
    <Link to="/game/$gameId" params={{ gameId: game.id }} className="block">
      <motion.div
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        className={cn(
          "bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-100 hover:bg-white/80 transition-all duration-200 touch-manipulation",
          className
        )}
      >
        {/* Two-line structure: Home team on line 1, Away team on line 2 */}
        <div className="space-y-2">
          {/* Line 1: Home Team */}
          <div className="flex items-center space-x-3">
            {renderTimeOrResult()}
            <TeamLogo team={game.homeTeam} />
            <span className="text-sm text-gray-700 font-medium truncate">
              {game.homeTeam.name}
            </span>
          </div>
          
          {/* Line 2: Away Team */}
          <div className="flex items-center space-x-3">
            <div className="min-w-[60px]"></div> {/* Spacer to align with time/result */}
            <TeamLogo team={game.awayTeam} />
            <span className="text-sm text-gray-700 font-medium truncate">
              {game.awayTeam.name}
            </span>
          </div>
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