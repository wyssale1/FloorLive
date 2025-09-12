import { motion } from 'framer-motion'
import { Target, AlertTriangle, Pause, Crown, Clock, Play, Zap, X, Info } from 'lucide-react'
import type { GameEvent } from '../lib/apiClient'
import GameEventsLegend from './GameEventsLegend'

// Extended GameEvent type for combined events
interface ExtendedGameEvent extends GameEvent {
  bestPlayerEvents?: GameEvent[]
}

interface GameTimelineProps {
  events: GameEvent[]
}

export default function GameTimeline({ events }: GameTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <GameEventsLegend />
        </div>
        <div className="text-center py-8 text-gray-500">
          No events recorded yet.
        </div>
      </div>
    )
  }

  // Backend already provides events in correct chronological order - no sorting needed!
  let sortedEvents = events

  // Combine best player events into a single entry
  const combineBestPlayerEvents = (events: GameEvent[]) => {
    const processedEvents: ExtendedGameEvent[] = []
    const bestPlayerEvents: GameEvent[] = []

    events.forEach(event => {
      if (event.event_type === 'best_player') {
        bestPlayerEvents.push(event)
      } else {
        processedEvents.push(event)
      }
    })

    // If we have best player events, combine them
    if (bestPlayerEvents.length > 0) {
      // Create a combined best player event
      const combinedEvent: ExtendedGameEvent = {
        id: `combined-best-players-${bestPlayerEvents[0].game_id}`,
        game_id: bestPlayerEvents[0].game_id,
        time: bestPlayerEvents[0].time,
        type: 'other',
        player: '',
        team: 'home',
        team_side: 'neutral',
        event_type: 'best_player_combined',
        icon: 'star',
        display_as: 'neutral',
        description: 'Beste Spieler',
        // Store the individual events for rendering
        bestPlayerEvents: bestPlayerEvents
      }

      // Find "Spielende" event and insert best players just after it (so they appear before it visually)
      const spielendeIndex = processedEvents.findIndex(e => 
        e.description === 'Spielende' || e.event_type === 'game_end'
      )
      
      if (spielendeIndex !== -1) {
        // Insert right after "Spielende" (which puts it visually before due to reverse order)
        processedEvents.splice(spielendeIndex + 1, 0, combinedEvent)
      } else {
        // If no "Spielende" found, insert at the beginning (top of timeline)
        processedEvents.unshift(combinedEvent)
      }
    }

    return processedEvents
  }

  sortedEvents = combineBestPlayerEvents(sortedEvents)

  const parseGoalInfo = (event: GameEvent) => {
    if (event.event_type !== 'goal') return null
    
    // Extract score from description like "Torschütze 4:4"
    const scoreMatch = event.description?.match(/(\d+):(\d+)/)
    if (!scoreMatch) return null
    
    const homeScore = parseInt(scoreMatch[1])
    const awayScore = parseInt(scoreMatch[2])
    
    // Use team_side instead of team for proper assignment
    const scoringTeam = event.team_side === 'home' ? 'home' : 'away'
    
    return {
      goalNumber: scoringTeam === 'home' ? homeScore : awayScore,
      opponentScore: scoringTeam === 'home' ? awayScore : homeScore,
      homeScore: homeScore,
      awayScore: awayScore,
      scoringTeam: scoringTeam,
      playerName: event.player
    }
  }

  const getEventIcon = (event: GameEvent) => {
    // Use backend's icon classification - all icons in neutral gray
    switch (event.icon) {
      case 'goal':
        return <Target className="w-4 h-4 text-gray-600" />
      case 'no_goal':
        return <X className="w-4 h-4 text-gray-600" />
      case 'penalty':
        return <AlertTriangle className="w-4 h-4 text-gray-600" />
      case 'whistle':
        return <Play className="w-4 h-4 text-gray-600" />
      case 'clock':
        return <Clock className="w-4 h-4 text-gray-600" />
      case 'penalty_shootout':
        return <Zap className="w-4 h-4 text-gray-600" />
      case 'star':
        return <Crown className="w-4 h-4 text-gray-600" />
      case 'pause':
        return <Pause className="w-4 h-4 text-gray-600" />
      default:
        return <Info className="w-4 h-4 text-gray-600" />
    }
  }

  const is2MinPenalty = (event: GameEvent) => {
    return event.event_type === 'penalty' && 
           (event.description?.includes('2min') || event.description?.includes("2'"))
  }


  const renderPlayerInfo = (event: GameEvent) => {
    if (event.event_type === 'timeout') {
      return "Timeout"
    }
    const goalInfo = parseGoalInfo(event)
    if (goalInfo) {
      return (
        <span>
          {goalInfo.scoringTeam === 'home' ? (
            <span><span className="font-bold">{goalInfo.homeScore}</span>-{goalInfo.awayScore}</span>
          ) : (
            <span>{goalInfo.homeScore}-<span className="font-bold">{goalInfo.awayScore}</span></span>
          )}
          {' '}
          {goalInfo.playerName}
        </span>
      )
    }
    return event.player
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <GameEventsLegend />
      </div>
      
      <div className="relative">
        {/* Central dotted line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px border-l-2 border-dashed border-gray-300 -translate-x-0.5"></div>
      
      <div className="space-y-4 py-4">
        {sortedEvents.map((event, index) => {
          // Use backend's display_as field to determine layout
          if (event.display_as === 'badge') {
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative flex justify-center my-6"
              >
                <div className="bg-white px-3 py-1 border border-gray-200 rounded-full">
                  <div className="text-sm font-medium text-gray-700 text-center">
                    {event.description}
                  </div>
                </div>
              </motion.div>
            )
          }

          // Inline events - use team_side, but for timeouts use team field since they have neutral team_side
          const isTimeoutEvent = event.event_type === 'timeout'
          const isHomeTeam = isTimeoutEvent ? event.team === 'home' : event.team_side === 'home'
          const isNeutralEvent = !isTimeoutEvent && event.team_side === 'neutral'
          
          // Handle neutral events (like best player) in center
          if (isNeutralEvent) {
            // Special handling for combined best player events
            if (event.event_type === 'best_player_combined' && (event as ExtendedGameEvent).bestPlayerEvents) {
              const extendedEvent = event as ExtendedGameEvent;
              const homeBestPlayer = extendedEvent.bestPlayerEvents?.find((e: GameEvent) => e.team_side === 'home')?.player || '';
              const awayBestPlayer = extendedEvent.bestPlayerEvents?.find((e: GameEvent) => e.team_side === 'away')?.player || '';
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative my-4"
                >
                  {/* Desktop layout: names on sides */}
                  <div className="hidden sm:flex items-center min-h-12">
                    {/* Home best player on left */}
                    <div className="flex-1 flex justify-end pr-4">
                      <div className="text-right">
                        {homeBestPlayer && (
                          <div className="text-sm text-gray-700 font-medium">
                            {homeBestPlayer}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Central badge */}
                    <div className="relative z-10 flex items-center justify-center">
                      <div className="bg-yellow-50 px-3 py-2 border border-yellow-200 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 text-center flex items-center gap-2">
                          {getEventIcon(event)}
                          <span>{event.description}</span>
                        </div>
                      </div>
                    </div>

                    {/* Away best player on right */}
                    <div className="flex-1 flex justify-start pl-4">
                      <div className="text-left">
                        {awayBestPlayer && (
                          <div className="text-sm text-gray-700 font-medium">
                            {awayBestPlayer}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mobile layout: same as desktop but smaller */}
                  <div className="sm:hidden flex items-center min-h-12">
                    {/* Home best player on left */}
                    <div className="flex-1 flex justify-end pr-2">
                      <div className="text-right">
                        {homeBestPlayer && (
                          <div className="text-xs text-gray-700 font-medium">
                            {homeBestPlayer}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Central badge */}
                    <div className="relative z-10 flex items-center justify-center px-2">
                      <div className="bg-yellow-50 px-2 py-1 border border-yellow-200 rounded-lg">
                        <div className="text-xs font-medium text-gray-700 text-center flex items-center gap-1">
                          {getEventIcon(event)}
                          <span className="hidden xs:inline">{event.description}</span>
                          <span className="xs:hidden">Beste</span>
                        </div>
                      </div>
                    </div>

                    {/* Away best player on right */}
                    <div className="flex-1 flex justify-start pl-2">
                      <div className="text-left">
                        {awayBestPlayer && (
                          <div className="text-xs text-gray-700 font-medium">
                            {awayBestPlayer}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            }
            
            // Default neutral event handling
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative flex justify-center my-4"
              >
                <div className="bg-yellow-50 px-3 py-2 border border-yellow-200 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 text-center flex items-center gap-2">
                    {getEventIcon(event)}
                    <span>{event.description}</span>
                    {event.player && <span className="font-bold">- {event.player}</span>}
                  </div>
                </div>
              </motion.div>
            )
          }
          
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
                      <div className="text-sm text-gray-700 font-medium">
                        {renderPlayerInfo(event)}
                      </div>
                      {event.assist && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          Assist: {event.assist}
                        </div>
                      )}
                      {/* Show full penalty description */}
                      {event.event_type === 'penalty' && event.description && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {event.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Central icon */}
                  <div className="relative z-10 flex items-center justify-center">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                      {is2MinPenalty(event) ? (
                        <span className="text-xs font-bold text-gray-600">+2</span>
                      ) : (
                        getEventIcon(event)
                      )}
                    </div>
                  </div>

                  {/* Time on right */}
                  <div className="flex-1 flex justify-start pl-4">
                    <div className="text-left">
                      <div className="text-xs text-gray-400 font-mono">
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
                      <div className="text-xs text-gray-400 font-mono">
                        {event.time}
                      </div>
                    </div>
                  </div>

                  {/* Central icon */}
                  <div className="relative z-10 flex items-center justify-center">
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                      {is2MinPenalty(event) ? (
                        <span className="text-xs font-bold text-gray-600">+2</span>
                      ) : (
                        getEventIcon(event)
                      )}
                    </div>
                  </div>

                  {/* Player info on right for away team */}
                  <div className="flex-1 flex justify-start pl-4">
                    <div className="text-left max-w-xs">
                      <div className="text-sm text-gray-700 font-medium">
                        {renderPlayerInfo(event)}
                      </div>
                      {event.assist && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          Assist: {event.assist}
                        </div>
                      )}
                      {/* Show full penalty description */}
                      {event.event_type === 'penalty' && event.description && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {event.description}
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
    </div>
  )
}