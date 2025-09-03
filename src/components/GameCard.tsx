import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import type { Game } from '../lib/mockData'
import { cn } from '../lib/utils'

interface GameCardProps {
  game: Game
  className?: string
}

export default function GameCard({ game, className }: GameCardProps) {
  const isLive = game.status === 'live'
  const isToday = game.status === 'today'

  return (
    <Link to="/game/$gameId" params={{ gameId: game.id }} className="block">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow touch-manipulation",
          className
        )}
      >
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex items-center space-x-3 flex-1">
            <div className="text-2xl">{game.homeTeam.logo}</div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 truncate">
                {game.homeTeam.name}
              </div>
              <div className="text-sm text-gray-500">{game.homeTeam.shortName}</div>
            </div>
          </div>

          {/* Score or Status */}
          <div className="px-4 text-center">
            {isToday ? (
              <div className="text-sm text-gray-600">
                <div className="text-xs text-gray-500">{game.startTime}</div>
              </div>
            ) : (
              <div className="font-bold text-2xl text-gray-900">
                {game.homeScore} - {game.awayScore}
              </div>
            )}
            
            {isLive && (
              <div className="flex items-center justify-center space-x-2 mt-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-red-600">
                  {game.time}
                </span>
              </div>
            )}
            
            {game.period && (
              <div className="text-xs text-gray-500 mt-1">{game.period}</div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex items-center space-x-3 flex-1 justify-end">
            <div className="min-w-0 flex-1 text-right">
              <div className="font-medium text-gray-900 truncate">
                {game.awayTeam.name}
              </div>
              <div className="text-sm text-gray-500">{game.awayTeam.shortName}</div>
            </div>
            <div className="text-2xl">{game.awayTeam.logo}</div>
          </div>
        </div>

        {/* League badge */}
        <div className="flex justify-between items-center mt-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {game.league}
          </span>
          
          {isLive && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1 animate-pulse"></div>
              Live
            </span>
          )}
        </div>
      </motion.div>
    </Link>
  )
}