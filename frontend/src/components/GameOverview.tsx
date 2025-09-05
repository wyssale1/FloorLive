import { useState, useEffect } from 'react'
import { MapPin, Clock, Users, Shield } from 'lucide-react'
import { apiClient } from '../lib/apiClient'
import GameCard from './GameCard'
import GameCardSkeleton from './GameCardSkeleton'

interface GameOverviewProps {
  game: any
  gameId: string
}

export default function GameOverview({ game, gameId }: GameOverviewProps) {
  const [headToHeadGames, setHeadToHeadGames] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchHeadToHeadGames = async () => {
      setLoading(true)
      const games = await apiClient.getHeadToHeadGames(gameId)
      setHeadToHeadGames(games)
      setLoading(false)
    }
    fetchHeadToHeadGames()
  }, [gameId])

  return (
    <div className="space-y-6">
      {/* Game Information Section */}
      <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-4 sm:p-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Game Information</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Date and Time */}
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <div className="text-sm font-medium text-gray-700">Date & Time</div>
              <div className="text-sm text-gray-600">
                {game.gameDate} at {game.startTime}
              </div>
            </div>
          </div>

          {/* League */}
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-gray-400" />
            <div>
              <div className="text-sm font-medium text-gray-700">League</div>
              <div className="text-sm text-gray-600">
                {game.league?.name || 'Unknown League'}
              </div>
            </div>
          </div>

          {/* Venue */}
          {(game.venue?.name || game.location) && (
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
                      {game.venue?.name || game.location}
                    </a>
                  ) : (
                    <span>{game.venue?.name || game.location}</span>
                  )}
                  {game.venue?.address && (
                    <div className="text-xs text-gray-500 mt-1">{game.venue.address}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Spectators */}
          {game.spectators && game.spectators > 0 && game.status === 'finished' && (
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-sm font-medium text-gray-700">Spectators</div>
                <div className="text-sm text-gray-600">
                  {game.spectators.toLocaleString()} {game.spectators === 1 ? 'spectator' : 'spectators'}
                </div>
              </div>
            </div>
          )}

          {/* Referees */}
          {(() => {
            const validReferees = [game.referees?.first, game.referees?.second]
              .filter(ref => ref && ref.trim() !== '' && ref !== '0' && ref !== 'null');
            return validReferees.length > 0 && (
              <div className="flex items-center space-x-2 sm:col-span-2">
                <Shield className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    {validReferees.length === 1 ? 'Referee' : 'Referees'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {validReferees.join(', ')}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Head-to-Head Section */}
      <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-4 sm:p-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Recent Meetings</h2>
        
        {loading ? (
          <div className="space-y-2">
            <GameCardSkeleton count={3} />
          </div>
        ) : headToHeadGames.length > 0 ? (
          <div className="space-y-2">
            {headToHeadGames.map((headToHeadGame) => (
              <GameCard key={headToHeadGame.id} game={headToHeadGame} />
            ))}
          </div>
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