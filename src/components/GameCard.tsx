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

  const renderGameStatus = () => {
    if (isLive) {
      return (
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-1 mb-0.5">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-600 font-medium text-sm">
              {game.homeScore} - {game.awayScore}
            </span>
          </div>
          {game.time && (
            <span className="text-xs text-gray-500">{game.time}</span>
          )}
        </div>
      )
    } else if (isUpcoming) {
      return (
        <div className="text-center">
          <span className="text-gray-700 font-medium text-sm">{game.startTime}</span>
        </div>
      )
    } else if (isFinished) {
      return (
        <div className="text-center">
          <span className="text-gray-800 font-medium text-sm">
            {game.homeScore} - {game.awayScore}
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
          "bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-gray-100/30 hover:bg-white/40 transition-all duration-200 touch-manipulation",
          className
        )}
      >
        {/* Two-line layout */}
        <div className="grid grid-cols-3 items-center gap-4">
          {/* Home Team - Left */}
          <div className="flex items-center space-x-2">
            <TeamLogo team={game.homeTeam} />
            <span className="text-sm text-gray-700 font-medium truncate">
              {game.homeTeam.name}
            </span>
          </div>
          
          {/* Game Status/Time - Center */}
          <div className="flex justify-center">
            {renderGameStatus()}
          </div>
          
          {/* Away Team - Right */}
          <div className="flex items-center justify-end space-x-2">
            <span className="text-sm text-gray-700 font-medium truncate">
              {game.awayTeam.name}
            </span>
            <TeamLogo team={game.awayTeam} />
          </div>
        </div>

        {/* Period info if available */}
        {game.period && (
          <div className="text-center mt-2">
            <div className="text-xs text-gray-400">{game.period}</div>
          </div>
        )}
      </motion.div>
    </Link>
  )
}