import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { User, Hash } from 'lucide-react'
import { cn } from '../lib/utils'
import type { Player } from '../shared/types'

interface PlayerCardProps {
  player: Player
  className?: string
  compact?: boolean
  showStats?: boolean
}

export default function PlayerCard({ 
  player, 
  className, 
  compact = false,
  showStats = false 
}: PlayerCardProps) {
  return (
    <Link to="/player/$playerId" params={{ playerId: player.id }} className="block">
      <motion.div
        whileTap={{ scale: 0.995 }}
        className={cn(
          "hover:bg-gray-50 transition-all duration-200 touch-manipulation",
          "border border-gray-100 rounded-lg bg-white/60 backdrop-blur-sm",
          compact ? "p-3" : "p-4",
          className
        )}
      >
        <div className="flex items-center gap-3">
          {/* Player Image */}
          <div className={cn(
            "bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0",
            compact ? "w-10 h-10" : "w-12 h-12"
          )}>
            {player.profileImage ? (
              <img 
                src={player.profileImage} 
                alt={player.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className={cn(
                "text-gray-400",
                compact ? "w-5 h-5" : "w-6 h-6"
              )} />
            )}
          </div>

          {/* Player Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn(
                "font-medium text-gray-900 truncate",
                compact ? "text-sm" : "text-base"
              )}>
                {player.name}
              </h3>
              {player.number && (
                <span className="flex items-center gap-0.5 text-xs text-gray-500 flex-shrink-0">
                  <Hash className="w-3 h-3" />
                  {player.number}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className={cn(
                "text-gray-600 truncate",
                compact ? "text-xs" : "text-sm"
              )}>
                {player.position || 'Position not specified'}
              </div>
              
              {showStats && (
                <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
                  {/* These would come from player statistics */}
                  <span>0G 0A</span>
                </div>
              )}
            </div>
            
            {!compact && player.yearOfBirth && (
              <div className="text-xs text-gray-500 mt-1">
                Born {player.yearOfBirth}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  )
}