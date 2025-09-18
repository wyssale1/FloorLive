import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

interface League {
  id: string
  label: string
  leagueId: string
  gameClass: string
  leagueName: string
}

interface LeagueSelectorProps {
  currentLeague: League
  availableLeagues: League[]
  onLeagueChange: (league: League) => void
  disabled?: boolean
  loading?: boolean
}

export default function LeagueSelector({
  currentLeague,
  availableLeagues,
  onLeagueChange,
  disabled = false,
  loading = false
}: LeagueSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleLeagueSelect = (league: League) => {
    if (league.id !== currentLeague.id && !disabled && !loading) {
      onLeagueChange(league)
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
            {currentLeague.label}
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
        className="min-w-[140px] bg-white/95 backdrop-blur-sm border-gray-200/50"
      >
        {availableLeagues.map((league) => {
          const isSelectedLeague = league.id === currentLeague.id

          return (
            <DropdownMenuItem
              key={league.id}
              onClick={() => handleLeagueSelect(league)}
              className={`
                cursor-pointer text-sm px-3 py-1.5 transition-colors duration-150
                ${isSelectedLeague
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5">
                  <span>{league.label}</span>
                </div>
                {isSelectedLeague && (
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