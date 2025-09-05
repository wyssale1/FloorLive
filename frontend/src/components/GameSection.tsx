import { motion } from 'framer-motion'
import GameCard from './GameCard'
import type { Game } from '../lib/mockData'

interface GameSectionProps {
  title: string
  games: Game[]
  gameCount?: number
  index?: number
}

export default function GameSection({ title, games, gameCount, index = 0 }: GameSectionProps) {
  if (games.length === 0) return null
  
  const displayCount = gameCount || games.length
  
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="mb-8"
    >
      {/* Title outside the box */}
      <h2 className="text-lg font-medium text-gray-800 mb-4 px-1">
        {title}
        <span className="text-sm text-gray-500 ml-2">
          {displayCount} {displayCount === 1 ? 'game' : 'games'}
        </span>
      </h2>
      
      {/* Single box containing all games */}
      <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100">
        {games.map((game, gameIndex) => (
          <div key={game.id}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index * 0.1) + (gameIndex * 0.05) }}
            >
              <GameCard game={game} />
            </motion.div>
            {/* Separator line between games (not after the last one) */}
            {gameIndex < games.length - 1 && (
              <div className="mx-3 border-b border-gray-100"></div>
            )}
          </div>
        ))}
      </div>
    </motion.section>
  )
}