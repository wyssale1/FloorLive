import { motion } from 'framer-motion'
import type { GameEvent } from '../lib/mockData'

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

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
        >
          {/* Time */}
          <div className="flex-shrink-0 text-right w-16">
            <div className="font-mono text-lg font-bold text-gray-900">
              {event.time}
            </div>
          </div>

          {/* Event Icon */}
          <div className="flex-shrink-0 mt-1">
            {event.type === 'goal' ? (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">⚽</span>
              </div>
            ) : (
              <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">📋</span>
              </div>
            )}
          </div>

          {/* Event Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900">
                {event.player}
              </span>
              {event.type === 'goal' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Goal
                </span>
              )}
              {event.type === 'penalty' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  Penalty
                </span>
              )}
            </div>
            
            {event.assist && (
              <div className="text-sm text-gray-600 mt-1">
                Assist: <span className="font-medium">{event.assist}</span>
              </div>
            )}
            
            {event.description && (
              <div className="text-sm text-gray-600 mt-1">
                {event.description}
              </div>
            )}
          </div>
        </motion.div>
      ))}

      {/* Period Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: events.length * 0.1 + 0.2 }}
        className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200"
      >
        <div className="text-center">
          <div className="text-sm font-medium text-blue-900 mb-1">
            1. Drittel beendet 2-1
          </div>
          <div className="text-xs text-blue-700">
            Period completed
          </div>
        </div>
      </motion.div>
    </div>
  )
}