import GameCard from './GameCard'
import type { Game } from '../lib/mockData'

interface GameListProps {
  games: Game[]
  showSeparators?: boolean
  className?: string
  showDate?: boolean
  noPaddingOnMobile?: boolean
}

export default function GameList({ games, showSeparators = true, className = "", showDate = false, noPaddingOnMobile = false }: GameListProps) {
  if (games.length === 0) return null
  
  return (
    <div className={className}>
      {games.map((game, index) => (
        <div key={game.id}>
          <GameCard game={game} showDate={showDate} noPaddingOnMobile={noPaddingOnMobile} />
          {/* Light separator line between games (not after the last one) */}
          {showSeparators && index < games.length - 1 && (
            <div className="border-b border-gray-100 mx-3 my-1"></div>
          )}
        </div>
      ))}
    </div>
  )
}