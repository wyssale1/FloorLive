import { motion } from 'framer-motion'
import GameCard from '../components/GameCard'
import { getGamesByStatus } from '../lib/mockData'

export default function Home() {
  const liveGames = getGamesByStatus('live')
  const todayGames = getGamesByStatus('today')
  const recentGames = getGamesByStatus('recent')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">
              <span className="text-red-500">●</span> Live <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full ml-2">{liveGames.length}</span>
            </h1>
            <button className="text-sm text-gray-600 hover:text-gray-900">
              All →
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-6">
        {/* Live Games Section */}
        {liveGames.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="space-y-4">
              {liveGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GameCard game={game} />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Today Section */}
        {todayGames.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 px-1">
              Today <span className="text-sm text-gray-500">{todayGames.length} games</span>
            </h2>
            <div className="space-y-4">
              {todayGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (index * 0.1) }}
                >
                  <GameCard game={game} />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Recent Section */}
        {recentGames.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 px-1">
              Recent <span className="text-sm text-gray-500">1 results</span>
            </h2>
            <div className="space-y-4">
              {recentGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (index * 0.1) }}
                >
                  <GameCard game={game} />
                  {game.status === 'recent' && (
                    <div className="text-xs text-gray-500 px-4 mt-2">
                      Yesterday
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  )
}