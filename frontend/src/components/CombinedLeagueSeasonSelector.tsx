import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { m } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { formatSeasonDisplay, getCurrentSeasonYear } from '../lib/seasonUtils'

interface League {
  id: string
  label: string
  shortLabel: string
  leagueId: string
  gameClass: string
  leagueName: string
  apiName: string
}

interface CombinedLeagueSeasonSelectorProps {
  currentLeague: League
  currentSeason: string
  availableLeagues: League[]
  availableSeasons: string[]
  onLeagueChange: (league: League) => void
  onSeasonChange: (season: string) => void
  disabled?: boolean
  loading?: boolean
}

export default function CombinedLeagueSeasonSelector({
  currentLeague,
  currentSeason,
  availableLeagues,
  availableSeasons,
  onLeagueChange,
  onSeasonChange,
  disabled = false,
  loading = false
}: CombinedLeagueSeasonSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleLeagueSelect = (league: League) => {
    if (league.id !== currentLeague.id && !disabled && !loading) {
      onLeagueChange(league)
    }
    setIsOpen(false)
  }

  const handleSeasonSelect = (season: string) => {
    if (season !== currentSeason && !disabled && !loading) {
      onSeasonChange(season)
    }
    setIsOpen(false)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild disabled={disabled || loading}>
        <m.button
          className={`
            inline-flex items-center gap-3 px-4 py-2 text-sm font-medium
            bg-gray-100/80 hover:bg-gray-200/80 border border-gray-200/50
            rounded-full transition-all duration-200
            ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
            ${isOpen ? 'bg-gray-200/80 shadow-sm' : ''}
          `}
          whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
          whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
        >
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">
              {currentLeague.label}
            </span>
            <div className="w-px h-4 bg-gray-300" />
            <span className="text-gray-600">
              {formatSeasonDisplay(parseInt(currentSeason))}
            </span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </m.button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="min-w-[200px] bg-white/95 backdrop-blur-sm border-gray-200/50"
      >
        {/* League Section */}
        <div className="px-2 py-1.5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-1">
            League
          </div>
          {availableLeagues.map((league) => {
            const isSelectedLeague = league.id === currentLeague.id
            return (
              <DropdownMenuItem
                key={league.id}
                onClick={() => handleLeagueSelect(league)}
                className={`
                  cursor-pointer text-sm px-2 py-1.5 rounded transition-colors duration-150
                  ${isSelectedLeague
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{league.label}</span>
                  {isSelectedLeague && (
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                  )}
                </div>
              </DropdownMenuItem>
            )
          })}
        </div>

        <DropdownMenuSeparator />

        {/* Season Section */}
        <div className="px-2 py-1.5">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-1">
            Season
          </div>
          {availableSeasons.map((season) => {
            const isSelectedSeason = season === currentSeason
            const isCurrentSeason = season === getCurrentSeasonYear().toString()
            return (
              <DropdownMenuItem
                key={season}
                onClick={() => handleSeasonSelect(season)}
                className={`
                  cursor-pointer text-sm px-2 py-1.5 rounded transition-colors duration-150
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
                      <span className="text-xs text-gray-400">•</span>
                    )}
                  </div>
                  {isSelectedSeason && (
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                  )}
                </div>
              </DropdownMenuItem>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}