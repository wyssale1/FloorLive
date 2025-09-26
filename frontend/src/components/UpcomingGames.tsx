import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import GameCard from './GameCard'

interface UpcomingGamesProps {
  games: Array<{
    id: string
    homeTeam: {
      id: string
      name: string
      shortName: string
      logo?: string
    }
    awayTeam: {
      id: string
      name: string
      shortName: string
      logo?: string
    }
    homeScore: number | null
    awayScore: number | null
    status: 'upcoming' | 'live' | 'finished'
    period?: string
    time?: string
    league: { id: string; name: string }
    startTime: string
    gameDate: string
    isLive?: boolean
  }>
  loading?: boolean
}

export default function UpcomingGames({ games, loading }: UpcomingGamesProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-sm">Loading upcoming games...</div>
      </div>
    )
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-sm mb-2">No upcoming games scheduled</div>
        <div className="text-gray-500 text-xs">
          Check back later for future fixtures.
        </div>
      </div>
    )
  }

  // Group games by date
  const gamesByDate = games.reduce((acc, game) => {
    const date = game.gameDate
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(game)
    return acc
  }, {} as Record<string, typeof games>)

  const sortedDates = Object.keys(gamesByDate).sort()

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Calendar className="w-4 h-4 text-gray-600" />
        <h3 className="text-lg font-medium text-gray-800">Upcoming Games</h3>
        <span className="text-sm text-gray-500">
          {games.length} {games.length === 1 ? 'game' : 'games'}
        </span>
      </div>

      {sortedDates.map((date, dateIndex) => (
        <motion.div
          key={date}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: dateIndex * 0.1 }}
          className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-6"
        >
          <h4 className="text-sm font-medium text-gray-700 mb-4">
            {formatDate(date)}
          </h4>
          
          <div className="space-y-2">
            {gamesByDate[date].map((game, gameIndex) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (dateIndex * 0.1) + (gameIndex * 0.05) }}
              >
                <GameCard game={{
                  ...game,
                  homeTeam: {
                    ...game.homeTeam,
                    shortName: game.homeTeam.shortName || game.homeTeam.name.substring(0, 3).toUpperCase(),
                    logo: game.homeTeam.logo || ''
                  },
                  awayTeam: {
                    ...game.awayTeam,
                    shortName: game.awayTeam.shortName || game.awayTeam.name.substring(0, 3).toUpperCase(),
                    logo: game.awayTeam.logo || ''
                  },
                  isLive: game.isLive || false
                }} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    // Format as locale date string
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    // Check if it's today or tomorrow
    if (date.toDateString() === today.toDateString()) {
      return `Today - ${formattedDate}`
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow - ${formattedDate}`
    } else {
      return formattedDate
    }
  } catch {
    return dateString
  }
}