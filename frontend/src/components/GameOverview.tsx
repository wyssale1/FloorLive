import { useState, useEffect } from 'react'
import { MapPin, Clock, Users, Trophy, Flag } from 'lucide-react'
import { motion } from 'framer-motion'
import { apiClient } from '../lib/apiClient'
import type { Game } from '../lib/apiClient'
import type { PlayoffSeries } from '../types/domain'
import { formatSwissDate } from '../lib/utils'
import GameList from './GameList'
import GameCardSkeleton from './GameCardSkeleton'

interface GameOverviewProps {
  game: Game
  gameId: string
}

export default function GameOverview({ game, gameId }: GameOverviewProps) {
  const [headToHeadGames, setHeadToHeadGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(false)
  const [seriesStanding, setSeriesStanding] = useState<PlayoffSeries | null>(null)

  useEffect(() => {
    const fetchHeadToHeadGames = async () => {
      setLoading(true)
      const games = await apiClient.getHeadToHeadGames(gameId)

      // First filter out canceled games (keep only finished games with actual results)
      const gamesWithResults = games.filter(game =>
        game.status === 'finished' &&
        game.homeScore !== null &&
        game.awayScore !== null
      )

      // Then take the first 5 games with results
      const finishedGames = gamesWithResults.slice(0, 5)

      setHeadToHeadGames(finishedGames)
      setLoading(false)
    }
    fetchHeadToHeadGames()
  }, [gameId])

  useEffect(() => {
    if (game.gamePhase !== 'playoff') return
    apiClient.getSeriesStanding(gameId).then(setSeriesStanding)
  }, [gameId, game.gamePhase])

  // Prepare game information items for staggered animation
  const gameInfoItems = []

  // Date and Time
  if (game.gameDate && game.startTime) {
    gameInfoItems.push({
      key: 'datetime',
      content: (
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <div>
            <div className="text-sm font-medium text-gray-700">Date & Time</div>
            <div className="text-sm text-gray-600">
              {formatSwissDate(game.gameDate)} at {game.startTime}
            </div>
          </div>
        </div>
      )
    })
  }

  // League
  if (game.league?.name && game.league.name !== '0') {
    gameInfoItems.push({
      key: 'league',
      content: (
        <div className="flex items-center space-x-2">
          <Trophy className="w-4 h-4 text-gray-400" />
          <div>
            <div className="text-sm font-medium text-gray-700">League</div>
            <div className="text-sm text-gray-600">
              {game.league.name}
            </div>
          </div>
        </div>
      )
    })
  }

  // Venue
  const venueName = game.venue?.name || game.location
  const isValidVenue = venueName && 
                      venueName.trim() !== '' && 
                      venueName !== '0' && 
                      venueName !== 'null' && 
                      venueName !== 'undefined'
  if (isValidVenue) {
    gameInfoItems.push({
      key: 'venue',
      content: (
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <div>
            <div className="text-sm font-medium text-gray-700">Venue</div>
            <div className="text-sm text-gray-600">
              {game.coordinates ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${game.coordinates.lat},${game.coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {venueName}
                </a>
              ) : (
                <span>{venueName}</span>
              )}
              {game.venue?.address && 
               game.venue.address.trim() !== '' && 
               game.venue.address !== '0' && 
               game.venue.address !== 'null' && (
                <div className="text-xs text-gray-500 mt-1">{game.venue.address}</div>
              )}
            </div>
          </div>
        </div>
      )
    })
  }

  // Spectators
  const spectatorCount = typeof game.spectators === 'number' ? game.spectators : parseInt(game.spectators || '0')
  if (spectatorCount > 0 && game.status === 'finished') {
    gameInfoItems.push({
      key: 'spectators',
      content: (
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-400" />
          <div>
            <div className="text-sm font-medium text-gray-700">Spectators</div>
            <div className="text-sm text-gray-600">
              {spectatorCount.toLocaleString()} {spectatorCount === 1 ? 'spectator' : 'spectators'}
            </div>
          </div>
        </div>
      )
    })
  }

  // Referees
  const validReferees = [game.referees?.first, game.referees?.second]
    .filter(ref => ref &&
                 typeof ref === 'string' &&
                 ref.trim() !== '' &&
                 ref !== '0' &&
                 ref !== 'null' &&
                 ref !== 'undefined' &&
                 ref.toLowerCase() !== 'null')
  if (validReferees.length > 0) {
    gameInfoItems.push({
      key: 'referees',
      content: (
        <div className="flex items-center space-x-2 sm:col-span-2">
          <Flag className="w-4 h-4 text-gray-400" />
          <div>
            <div className="text-sm font-medium text-gray-700">
              {validReferees.length === 1 ? 'Referee' : 'Referees'}
            </div>
            <div className="text-sm text-gray-600">
              {validReferees.join(', ')}
            </div>
          </div>
        </div>
      )
    })
  }

  return (
    <div className="space-y-6">
      {/* Game Information Section */}
      <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-4 sm:p-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Game Information</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {gameInfoItems.map((item, index) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.4,
                delay: index * 0.05,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
            >
              {item.content}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Head-to-Head Section */}
      <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-4 sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-medium text-gray-800">Recent Meetings</h2>
          {seriesStanding && (
            <p className="text-sm text-gray-500 mt-1">
              Playoff {seriesStanding.roundName} · Serie {seriesStanding.teamAWins}:{seriesStanding.teamBWins}
              {seriesStanding.isFinished && ' · Serie beendet'}
            </p>
          )}
        </div>
        
        {loading ? (
          <GameCardSkeleton variant="list" count={3} />
        ) : headToHeadGames.length > 0 ? (
          <GameList games={headToHeadGames} showSeparators={true} showDate={true} noPaddingOnMobile={true} currentGameId={gameId} />
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-sm mb-1">No recent meetings found</div>
            <div className="text-gray-500 text-xs">
              These teams haven't played each other recently
            </div>
          </div>
        )}
      </div>
    </div>
  )
}