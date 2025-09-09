import { motion } from 'framer-motion'
import GameCard from './GameCard'
import type { Game } from '../lib/mockData'

interface GameListProps {
  games: Game[]
  showSeparators?: boolean
  className?: string
  showDate?: boolean
  noPaddingOnMobile?: boolean
  currentGameId?: string
}

export default function GameList({ games, showSeparators = true, className = "", showDate = false, noPaddingOnMobile = false, currentGameId }: GameListProps) {
  if (games.length === 0) return null
  
  return (
    <div className={className}>
      {games.map((game, index) => (
        <motion.div 
          key={game.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.4,
            delay: index * 0.05,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        >
          <GameCard game={game} showDate={showDate} noPaddingOnMobile={noPaddingOnMobile} currentGameId={currentGameId} />
          {/* Light separator line between games (not after the last one) */}
          {showSeparators && index < games.length - 1 && (
            <div className={`border-b border-gray-100 mx-3 ${noPaddingOnMobile ? 'my-0' : 'my-1'}`}></div>
          )}
        </motion.div>
      ))}
    </div>
  )
}