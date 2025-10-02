import { motion } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import { Trophy, RotateCcw } from 'lucide-react'
import TeamLogo from './TeamLogo'
import LeagueTableLegend from './LeagueTableLegend'
import { formatSeasonDisplay, getCurrentSeasonYear } from '../lib/seasonUtils'
import type { TeamRanking } from '../types/domain'

interface League {
  id: string
  label: string
  shortLabel: string
  leagueId: string
  gameClass: string
  leagueName: string
}

interface LeagueTableProps {
  table: {
    leagueId: string
    leagueName: string
    season?: string
    standings: TeamRanking[]
    homeTeamId?: string // For home/away badges
    awayTeamId?: string // For home/away badges
  } | null
  loading?: boolean
  currentTeamId?: string
  highlightTeamIds?: string[] // For highlighting multiple teams (e.g., game participants)
  // Season selector props
  availableSeasons?: string[]
  onSeasonChange?: (season: string) => void
  seasonSelectorDisabled?: boolean
  // League selector props
  availableLeagues?: League[]
  currentLeague?: League
  onLeagueChange?: (league: League) => void
}

export default function LeagueTable({
  table,
  loading,
  currentTeamId,
  highlightTeamIds = [],
  availableSeasons,
  onSeasonChange,
  seasonSelectorDisabled = false,
  currentLeague
}: LeagueTableProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-sm">Loading league table...</div>
      </div>
    )
  }

  if (!table || !table.standings || !Array.isArray(table.standings) || table.standings.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-800">Standings</h2>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="text-gray-400 text-sm mb-2">League table not available</div>
          <div className="text-gray-500 text-xs">
            Standings are published after the first games of the season are played.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-3 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {currentLeague && table.season && (
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded">
              {currentLeague.shortLabel} | {formatSeasonDisplay(parseInt(table.season))}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {table.season && availableSeasons && onSeasonChange &&
           table.season !== getCurrentSeasonYear().toString() && (
            <button
              onClick={() => onSeasonChange(getCurrentSeasonYear().toString())}
              disabled={seasonSelectorDisabled}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Back to current season"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Current</span>
            </button>
          )}
          <LeagueTableLegend />
        </div>
      </div>

      {/* Header Row */}
      <div className="flex items-center justify-between py-2 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
        <div className="flex items-center space-x-3">
          <div className="w-8 pl-1"></div> {/* Position space with left padding */}
          <div className="w-8"></div> {/* Logo space */}
          <div className="pl-0">Team</div> {/* Align with team name text */}
        </div>
        <div className="flex items-center space-x-4 flex-shrink-0 pr-1">
          <div className="text-center w-8">Pts</div>
          <div className="hidden sm:block text-center w-8">Diff</div>
          <div className="hidden md:block text-center w-8">GP</div>
        </div>
      </div>

      {/* Table Rows - Simple List Style */}
      <div className="space-y-0 divide-y divide-gray-200">
        {(table.standings || []).map((team, index) => {
          const isCurrentTeam = currentTeamId && team.teamId === currentTeamId
          const isHighlightedTeam = highlightTeamIds.includes(team.teamId)
          const isHomeTeam = table.homeTeamId && team.teamId === table.homeTeamId
          const isAwayTeam = table.awayTeamId && team.teamId === table.awayTeamId
          const diffColor = team.goalDifference > 0 
            ? 'text-green-600' 
            : team.goalDifference < 0 
            ? 'text-red-600' 
            : 'text-gray-600'
          const diffDisplay = team.goalDifference > 0 
            ? `+${team.goalDifference}` 
            : `${team.goalDifference}`
          
          // Determine background color priority: current team > highlighted teams > hover
          const backgroundClass = isCurrentTeam 
            ? 'bg-blue-50' 
            : isHighlightedTeam 
            ? 'bg-blue-50' 
            : 'hover:bg-gray-50'
          
          return (
            <motion.div
              key={team.teamId || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.4,
                delay: index * 0.05,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              className={`flex items-center justify-between py-3 px-0 transition-colors ${backgroundClass}`}
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                {/* Position Number */}
                <div className="flex-shrink-0 w-8 pl-1">
                  <span className={`font-medium rounded-full w-5 h-5 flex items-center justify-center text-xs ${
                    isCurrentTeam || isHighlightedTeam 
                      ? 'text-blue-700 bg-blue-100' 
                      : 'text-gray-600 bg-gray-50'
                  }`}>{team.position}</span>
                </div>
                
                {/* Team Logo */}
                <TeamLogo
                  team={{
                    id: team.teamId,
                    name: team.teamName,
                    logo: team.teamLogo || undefined
                  }}
                  size="small"
                  className="shrink-0"
                  showSwissUnihockeyFallback={true}
                />
                
                {/* Team Info */}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-800 truncate flex items-center gap-2">
                    <span className="truncate">
                      {isCurrentTeam ? (
                        <span>{team.teamName}</span>
                      ) : (
                        <Link 
                          to="/team/$teamId" 
                          params={{ teamId: team.teamId }}
                          className="transition-colors hover:text-blue-600"
                        >
                          {team.teamName}
                        </Link>
                      )}
                    </span>
                    {/* Home/Away badges - hidden on mobile */}
                    {(isHomeTeam || isAwayTeam) && (
                      <span className={`
                        hidden sm:inline-flex text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0
                        ${isHomeTeam 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-blue-100 text-blue-700'
                        }
                      `}>
                        {isHomeTeam ? 'Home' : 'Away'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600">
                    {team.goalsFor}:{team.goalsAgainst}
                    {/* Show goal difference on mobile */}
                    <span className="sm:hidden ml-2">
                      <span className={diffColor}>
                        {diffDisplay}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Right Side Stats */}
              <div className="flex items-center space-x-4 text-sm flex-shrink-0 pr-1">
                {/* Points - Always visible */}
                <div className="text-center w-8">
                  <div className="font-bold text-gray-900">{team.points}</div>
                </div>
                
                {/* Goal Difference - Hidden on mobile (shown inline in team info) */}
                <div className="hidden sm:block text-center w-8">
                  <div className={`font-medium ${diffColor}`}>
                    {diffDisplay}
                  </div>
                </div>
                
                {/* Games Played - Hidden on tablet, shown on desktop */}
                <div className="hidden md:block text-center w-8">
                  <div className="font-medium text-gray-700">{team.games}</div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}