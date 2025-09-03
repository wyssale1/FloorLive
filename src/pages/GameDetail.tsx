import { useParams, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ChevronLeft, Clock } from 'lucide-react'
import { getGameById, getGameEvents } from '../lib/mockData'
import GameTimeline from '../components/GameTimeline'

export default function GameDetail() {
  const { gameId } = useParams({ from: '/game/$gameId' })
  const game = getGameById(gameId)
  const events = getGameEvents(gameId)
  
  if (!game) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Game Not Found</h1>
          <Link to="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>

      {/* Team Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/50 backdrop-blur-sm"
      >
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center flex-wrap gap-4 sm:gap-8 sm:flex-nowrap">
            {/* Home Team */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-2 sm:space-x-4 flex-1 sm:flex-none justify-center sm:justify-end"
            >
              <div className="text-4xl sm:text-6xl">{game.homeTeam.logo}</div>
              <div className="text-center sm:text-right">
                <div className="text-lg sm:text-2xl font-semibold text-gray-800">
                  {game.homeTeam.name}
                </div>
              </div>
            </motion.div>

            {/* Score */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="mx-4 sm:mx-8 text-center order-first sm:order-none w-full sm:w-auto"
            >
              <div className="text-4xl sm:text-6xl font-semibold text-gray-800 mb-2">
                {game.homeScore} - {game.awayScore}
              </div>
              
              {/* Status indicators */}
              <div className="flex items-center justify-center space-x-2 mb-2">
                {game.status === 'live' && (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  </>
                )}
                {game.status === 'today' && (
                  <>
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  </>
                )}
                {game.status === 'recent' && (
                  <>
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  </>
                )}
              </div>

              {game.period && (
                <div className="text-sm text-gray-600 mb-1">{game.period}</div>
              )}
              
              {game.time && (
                <div className="text-sm font-medium text-gray-900">{game.time}</div>
              )}
              
              {game.startTime && (
                <div className="text-sm text-gray-600">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {game.startTime}
                </div>
              )}
            </motion.div>

            {/* Away Team */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-2 sm:space-x-4 flex-1 sm:flex-none justify-center sm:justify-start"
            >
              <div className="text-center sm:text-left">
                <div className="text-lg sm:text-2xl font-semibold text-gray-800">
                  {game.awayTeam.name}
                </div>
              </div>
              <div className="text-4xl sm:text-6xl">{game.awayTeam.logo}</div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Game Status Banner */}
      {game.status === 'live' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-red-500 text-white text-center py-2"
        >
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-medium">Live Game</span>
          </div>
        </motion.div>
      )}

      {/* Game Events */}
      <div className="container mx-auto px-4 py-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Game Timeline</h2>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Live updates</span>
            </div>
          </div>
          
          <GameTimeline events={events} />
        </motion.div>
      </div>
    </div>
  )
}