import { motion } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import { Trophy } from 'lucide-react'
import TeamLogo from './TeamLogo'
import { formatSeasonDisplay } from '../lib/seasonUtils'
import type { TeamRanking } from '../shared/types'

interface LeagueTableProps {
  table: {
    leagueId: string
    leagueName: string
    season?: string
    standings: TeamRanking[]
  } | null
  loading?: boolean
  currentTeamId?: string
}

export default function LeagueTable({ table, loading, currentTeamId }: LeagueTableProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-sm">Loading league table...</div>
      </div>
    )
  }

  if (!table || table.standings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-sm mb-2">League table not available</div>
        <div className="text-gray-500 text-xs">
          Standings information may not be published yet.
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-3 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Trophy className="w-4 h-4 text-gray-600" />
          <h2 className="text-lg font-medium text-gray-800">Standings</h2>
        </div>
        {table.season && (
          <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {formatSeasonDisplay(parseInt(table.season))}
          </span>
        )}
      </div>

      {/* Header Row */}
      <div className="flex items-center justify-between py-2 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
        <div className="flex items-center space-x-3">
          <div className="w-6"></div> {/* Position space */}
          <div className="w-8"></div> {/* Logo space */}
          <div>Team</div>
        </div>
        <div className="flex items-center space-x-4 flex-shrink-0">
          <div className="text-center w-8">Pts</div>
          <div className="hidden sm:block text-center w-8">Diff</div>
          <div className="hidden md:block text-center w-8">GP</div>
        </div>
      </div>

      {/* Table Rows - Simple List Style */}
      <div className="space-y-0 divide-y divide-gray-200">
        {table.standings.map((team, index) => {
          const isCurrentTeam = currentTeamId && team.teamId === currentTeamId
          const diffColor = team.goalDifference > 0 
            ? 'text-green-600' 
            : team.goalDifference < 0 
            ? 'text-red-600' 
            : 'text-gray-600'
          const diffDisplay = team.goalDifference > 0 
            ? `+${team.goalDifference}` 
            : `${team.goalDifference}`
          
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
              className={`flex items-center justify-between py-3 px-0 transition-colors ${
                isCurrentTeam ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                {/* Position Number */}
                <div className="flex-shrink-0 w-6 text-center">
                  <span className="text-lg font-medium text-gray-500">{team.position}</span>
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
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {isCurrentTeam ? (
                      <span>{team.teamName}</span>
                    ) : (
                      <Link 
                        to="/team/$teamId" 
                        params={{ teamId: team.teamId }}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {team.teamName}
                      </Link>
                    )}
                  </div>
                  <div className="text-xs text-gray-600">
                    {team.wins}W-{team.losses}L • {team.goalsFor}:{team.goalsAgainst}
                  </div>
                </div>
              </div>
              
              {/* Right Side Stats */}
              <div className="flex items-center space-x-4 text-sm flex-shrink-0">
                {/* Points - Always visible */}
                <div className="text-center w-8">
                  <div className="font-bold text-gray-900">{team.points}</div>
                </div>
                
                {/* Goal Difference - Hidden on mobile */}
                <div className="hidden sm:block text-center w-8">
                  <div className={`font-medium ${diffColor}`}>
                    {diffDisplay}
                  </div>
                </div>
                
                {/* Games Played - Hidden on mobile */}
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