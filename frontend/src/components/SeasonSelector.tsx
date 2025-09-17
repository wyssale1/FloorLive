import { useState } from 'react'
import { ChevronDown, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { formatSeasonDisplay, getCurrentSeasonYear } from '../lib/seasonUtils'

interface SeasonSelectorProps {
  currentSeason: string
  availableSeasons: string[]
  onSeasonChange: (season: string) => void
  disabled?: boolean
  loading?: boolean
}

export default function SeasonSelector({
  currentSeason,
  availableSeasons,
  onSeasonChange,
  disabled = false,
  loading = false
}: SeasonSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSeasonSelect = (season: string) => {
    if (season !== currentSeason && !disabled && !loading) {
      onSeasonChange(season)
    }
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild disabled={disabled || loading}>
        <motion.button
          className={`
            inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium
            bg-gray-100/80 hover:bg-gray-200/80 border border-gray-200/50
            rounded-full transition-all duration-200
            ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
            ${isOpen ? 'bg-gray-200/80 shadow-sm' : ''}
          `}
          whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
          whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
        >
          <span className="text-gray-700">
            {formatSeasonDisplay(parseInt(currentSeason))}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </motion.button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="min-w-[130px] bg-white/95 backdrop-blur-sm border-gray-200/50"
      >
        {availableSeasons.map((season) => {
          const isSelectedSeason = season === currentSeason
          const isCurrentSeason = season === getCurrentSeasonYear().toString()

          return (
            <DropdownMenuItem
              key={season}
              onClick={() => handleSeasonSelect(season)}
              className={`
                cursor-pointer text-sm px-3 py-1.5 transition-colors duration-150
                ${isSelectedSeason
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                  <span>{formatSeasonDisplay(parseInt(season))}</span>
                  {isCurrentSeason && (
                    <Star className="w-3 h-3 text-gray-400 fill-current flex-shrink-0" />
                  )}
                </div>
                {isSelectedSeason && (
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                )}
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}