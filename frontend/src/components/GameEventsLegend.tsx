import { Target, AlertTriangle, Pause, Crown, HelpCircle, X } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function GameEventsLegend() {
  const [isOpen, setIsOpen] = useState(false)

  const legendItems = [
    {
      icon: <Target className="w-4 h-4 text-gray-600" />,
      label: 'Goal',
      description: 'Goal scored with current score and player name'
    },
    {
      icon: <span className="text-sm font-bold text-gray-600">+2</span>,
      label: '2-Minute Penalty', 
      description: 'Two-minute penalty given to a player'
    },
    {
      icon: <AlertTriangle className="w-4 h-4 text-gray-600" />,
      label: 'Other Penalty',
      description: 'Penalties other than 2-minute (5min, 10min, etc.)'
    },
    {
      icon: <Pause className="w-4 h-4 text-gray-600" />,
      label: 'Timeout',
      description: 'Team timeout called during the game'
    },
    {
      icon: <Crown className="w-4 h-4 text-gray-600" />,
      label: 'Best Player',
      description: 'Player of the match award'
    }
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
        <span>Legend</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-6 right-0 sm:left-0 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-72 max-w-[90vw]"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-800">Event Legend</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5">
              {legendItems.map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}