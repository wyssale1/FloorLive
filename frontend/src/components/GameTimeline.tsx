import { motion } from 'framer-motion'
import { Target, AlertTriangle, Pause, Crown } from 'lucide-react'
import type { GameEvent } from '../lib/apiClient'

interface GameTimelineProps {
  events: GameEvent[]
}

export default function GameTimeline({ events }: GameTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No events recorded yet.
      </div>
    )
  }

  const isPeriodEvent = (event: GameEvent) => {
    return event.type === 'other' && (
      event.description?.includes('Ende') || 
      event.description?.includes('Beginn') ||
      event.description?.includes('Drittel') ||
      event.description?.includes('beendet') ||
      event.description?.includes('Spielbeginn') ||
      event.description?.includes('Spielende')
    )
  }

  const is2MinPenalty = (event: GameEvent) => {
    return event.type === 'penalty' && 
           (event.description?.includes('2min') || event.description?.includes("2'"))
  }

  const isTimeout = (event: GameEvent) => {
    return event.type === 'timeout' || 
           (event.type === 'other' && event.description?.toLowerCase().includes('timeout'))
  }

  const isBestPlayer = (event: GameEvent) => {
    return event.description?.includes('Bester Spieler') || false
  }

  const parseGoalInfo = (event: GameEvent) => {
    if (event.type !== 'goal') return null
    
    // Extract score from description like "Torschütze 4:4"
    const scoreMatch = event.description?.match(/(\d+):(\d+)/)
    if (!scoreMatch) return null
    
    const homeScore = parseInt(scoreMatch[1])
    const awayScore = parseInt(scoreMatch[2])
    
    // The API provides score in home:away format consistently
    // We need to display it as "currentScore after this goal"
    if (event.team === 'home') {
      return {
        goalNumber: homeScore, // This home team's goal number
        opponentScore: awayScore, // Away team's current score
        currentScore: `${homeScore}-${awayScore}`, // Current game score
        playerName: event.player
      }
    } else {
      return {
        goalNumber: awayScore, // This away team's goal number  
        opponentScore: homeScore, // Home team's current score
        currentScore: `${homeScore}-${awayScore}`, // Current game score (home-away)
        playerName: event.player
      }
    }
  }

  const getEventIcon = (event: GameEvent) => {
    if (isBestPlayer(event)) {
      return <Crown className="w-3 h-3 text-gray-600" />
    }
    if (event.type === 'goal') {
      return <Target className="w-3 h-3 text-gray-600" />
    }
    if (isTimeout(event)) {
      return <Pause className="w-3 h-3 text-gray-600" />
    }
    if (event.type === 'penalty' && !is2MinPenalty(event)) {
      return <AlertTriangle className="w-3 h-3 text-gray-600" />
    }
    return null
  }

  // Helper function to parse time string to minutes for sorting
  const parseTimeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0
    const parts = timeStr.split(':')
    if (parts.length !== 2) return 0
    return parseInt(parts[0]) * 60 + parseInt(parts[1])
  }

  // Deduplicate consecutive identical period events first
  const deduplicatedEvents = events.reduce((acc: GameEvent[], event: GameEvent) => {
    // For period events, check if it's identical to the previous period event
    if (isPeriodEvent(event)) {
      const lastEvent = acc[acc.length - 1]
      // Skip if the last event was the same period event
      if (lastEvent && isPeriodEvent(lastEvent) && 
          lastEvent.description === event.description) {
        return acc // Skip this duplicate
      }
    }
    acc.push(event)
    return acc
  }, [])

  // Separate events into categories for proper 3-tier sorting
  const bestPlayerEvents = deduplicatedEvents.filter(isBestPlayer)
  const gameEndEvents = deduplicatedEvents.filter(e => 
    isPeriodEvent(e) && e.description?.includes('Spielende')
  )
  const regularEvents = deduplicatedEvents.filter(e => 
    !isBestPlayer(e) && !(isPeriodEvent(e) && e.description?.includes('Spielende'))
  )
  
  // Sort regular events in reverse chronological order (latest first)
  const sortedRegularEvents = regularEvents.sort((a, b) => {
    const timeA = parseTimeToMinutes(a.time)
    const timeB = parseTimeToMinutes(b.time)
    
    // If both have no time (like some period events), keep original order
    if (timeA === 0 && timeB === 0) return 0
    
    // Events with time come before events without time
    if (timeA === 0) return 1
    if (timeB === 0) return -1
    
    // Regular sorting: reverse chronological (latest first)
    return timeB - timeA
  })
  
  // Combine: best players first, then game end events, then regular events
  const sortedEvents = [...bestPlayerEvents, ...gameEndEvents, ...sortedRegularEvents]

  const renderPlayerInfo = (event: GameEvent) => {
    if (isTimeout(event)) {
      return "Timeout"
    }
    const goalInfo = parseGoalInfo(event)
    if (goalInfo) {
      return (
        <span>
          <span className="font-bold">{goalInfo.currentScore}</span> {goalInfo.playerName}
        </span>
      )
    }
    return event.player
  }

  return (
    <div className="relative">
      {/* Central dotted line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px border-l-2 border-dashed border-gray-300 -translate-x-0.5"></div>
      
      <div className="space-y-4 py-4">
        {sortedEvents.map((event, index) => {
          // Check if this is a period marker event
          if (isPeriodEvent(event)) {
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative flex justify-center my-6"
              >
                <div className="bg-white px-3 py-1 border border-gray-200 rounded-full">
                  <div className="text-xs font-medium text-gray-700 text-center">
                    {event.description}
                  </div>
                </div>
              </motion.div>
            )
          }

          const isHomeTeam = event.team === 'home'
          
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative flex items-center min-h-12"
            >
              {isHomeTeam ? (
                <>
                  {/* Player info on left */}
                  <div className="flex-1 flex justify-end pr-4">
                    <div className="text-right max-w-xs">
                      <div className="text-xs text-gray-700 font-medium">
                        {renderPlayerInfo(event)}
                      </div>
                      {event.assist && (
                        <div className="text-2xs text-gray-500 mt-0.5">
                          Assist: {event.assist}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Central icon */}
                  <div className="relative z-10 flex items-center justify-center">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                      {is2MinPenalty(event) ? (
                        <span className="text-2xs font-bold text-gray-600">+2</span>
                      ) : (
                        getEventIcon(event)
                      )}
                    </div>
                  </div>

                  {/* Time on right */}
                  <div className="flex-1 flex justify-start pl-4">
                    <div className="text-left">
                      <div className="text-2xs text-gray-400 font-mono">
                        {event.time}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Time on left for away team */}
                  <div className="flex-1 flex justify-end pr-4">
                    <div className="text-right">
                      <div className="text-2xs text-gray-400 font-mono">
                        {event.time}
                      </div>
                    </div>
                  </div>

                  {/* Central icon */}
                  <div className="relative z-10 flex items-center justify-center">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                      {is2MinPenalty(event) ? (
                        <span className="text-2xs font-bold text-gray-600">+2</span>
                      ) : (
                        getEventIcon(event)
                      )}
                    </div>
                  </div>

                  {/* Player info on right for away team */}
                  <div className="flex-1 flex justify-start pl-4">
                    <div className="text-left max-w-xs">
                      <div className="text-xs text-gray-700 font-medium">
                        {renderPlayerInfo(event)}
                      </div>
                      {event.assist && (
                        <div className="text-2xs text-gray-500 mt-0.5">
                          Assist: {event.assist}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}