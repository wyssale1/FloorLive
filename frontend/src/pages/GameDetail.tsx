import { useParams, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { ChevronLeft, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiClient, type Game, type GameEvent } from '../lib/apiClient'
import GameTimeline from '../components/GameTimeline'

export default function GameDetail() {
  const { gameId } = useParams({ from: '/game/$gameId' })
  const [game, setGame] = useState<any>(null)
  const [events, setEvents] = useState<GameEvent[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchGameData = async () => {
      setLoading(true)
      try {
        const [gameData, eventsData] = await Promise.all([
          apiClient.getGameDetails(gameId),
          apiClient.getGameEvents(gameId)
        ])
        
        if (gameData) {
          setGame(apiClient.adaptGameForFrontend(gameData))
        }
        setEvents(eventsData)
      } catch (error) {
        console.error('Error fetching game data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchGameData()
  }, [gameId])
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">Loading game details...</div>
        </div>
      </div>
    )
  }
  
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
    <div className="container mx-auto px-4 py-6 max-w-7xl">

      {/* Team Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/50 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center flex-wrap gap-4 sm:gap-8 sm:flex-nowrap">
            {/* Home Team */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center space-x-2 sm:space-x-4 flex-1 sm:flex-none justify-center sm:justify-end"
            >
              {game.homeTeam.logo ? (
                <img 
                  src={game.homeTeam.logo} 
                  alt={`${game.homeTeam.name} logo`}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <div className="text-4xl sm:text-6xl" style={{ display: game.homeTeam.logo ? 'none' : 'block' }}>
                🏒
              </div>
              <div className="text-center sm:text-right">
                <div className="text-base sm:text-xl font-medium text-gray-800">
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
              <div className="text-3xl sm:text-5xl font-medium text-gray-800 mb-2">
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
              
              {game.startTime && (
                <div className="text-sm text-gray-600">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {game.startTime}
                </div>
              )}
              
              {game.gameDate && (
                <div className="text-xs text-gray-500 mt-1">
                  {typeof game.gameDate === 'string' ? game.gameDate : game.gameDate.toLocaleDateString()}
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
                <div className="text-base sm:text-xl font-medium text-gray-800">
                  {game.awayTeam.name}
                </div>
              </div>
              {game.awayTeam.logo ? (
                <img 
                  src={game.awayTeam.logo} 
                  alt={`${game.awayTeam.name} logo`}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <div className="text-4xl sm:text-6xl" style={{ display: game.awayTeam.logo ? 'none' : 'block' }}>
                🏒
              </div>
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
      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-800">Game Timeline</h2>
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