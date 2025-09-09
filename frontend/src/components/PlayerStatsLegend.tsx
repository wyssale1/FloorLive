import { HelpCircle, X } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function PlayerStatsLegend() {
  const [isOpen, setIsOpen] = useState(false)

  const legendItems = [
    {
      abbr: 'GP',
      label: 'Games Played',
      description: 'Total number of games the player participated in'
    },
    {
      abbr: 'G',
      label: 'Goals', 
      description: 'Total goals scored by the player'
    },
    {
      abbr: 'A',
      label: 'Assists',
      description: 'Total assists made by the player'
    },
    {
      abbr: 'PTS',
      label: 'Points',
      description: 'Total points (Goals + Assists)'
    },
    {
      abbr: 'PIM',
      label: 'Penalty Minutes',
      description: 'Total penalty minutes accumulated'
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
            className="absolute top-6 right-0 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-72"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-800">Statistics Legend</h3>
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
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className="text-sm font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                      {item.abbr}
                    </span>
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