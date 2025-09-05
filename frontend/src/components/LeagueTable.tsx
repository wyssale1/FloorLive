import { motion } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import { Trophy } from 'lucide-react'
import TeamLogo from './TeamLogo'
import type { TeamRanking } from '../shared/types'

interface LeagueTableProps {
  table: {
    leagueId: string
    leagueName: string
    standings: TeamRanking[]
  } | null
  loading?: boolean
}

export default function LeagueTable({ table, loading }: LeagueTableProps) {
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
    <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Trophy className="w-4 h-4 text-gray-600" />
        <h3 className="text-lg font-medium text-gray-800">{table.leagueName}</h3>
        <span className="text-sm text-gray-500">
          {table.standings.length} teams
        </span>
      </div>

      {/* Table Header - Hidden on mobile */}
      <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 mb-3 px-3 py-2 bg-gray-50/50 rounded-lg">
        <div className="col-span-1">#</div>
        <div className="col-span-4">Team</div>
        <div className="col-span-1">GP</div>
        <div className="col-span-1">W</div>
        <div className="col-span-1">D</div>
        <div className="col-span-1">L</div>
        <div className="col-span-2">Goals</div>
        <div className="col-span-1">Pts</div>
      </div>

      {/* Table Rows */}
      <div className="space-y-1">
        {table.standings.map((team, index) => (
          <motion.div
            key={team.teamId || index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            className="grid grid-cols-12 gap-2 items-center p-3 bg-white/40 rounded-lg border border-gray-100 hover:bg-white/60 transition-colors"
          >
            {/* Position */}
            <div className="col-span-1 text-sm font-medium text-gray-700">
              {team.position}
            </div>
            
            {/* Team */}
            <div className="col-span-5 sm:col-span-4 flex items-center space-x-2">
              <TeamLogo 
                team={{ 
                  id: team.teamId, 
                  name: team.teamName, 
                  logo: team.teamLogo || undefined 
                }} 
                size="small" 
                className="w-5 h-5 shrink-0"
              />
              <Link 
                to="/team/$teamId" 
                params={{ teamId: team.teamId }}
                className="text-sm text-gray-700 font-medium truncate hover:text-gray-900 transition-colors"
              >
                {team.teamName}
              </Link>
            </div>

            {/* Stats - Mobile Layout */}
            <div className="col-span-6 sm:hidden flex justify-between text-xs text-gray-600">
              <div className="text-center">
                <div className="font-medium text-gray-700">{team.points}</div>
                <div>pts</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-700">{team.games}</div>
                <div>gp</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-700">{team.wins}</div>
                <div>w</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-700">{team.goalsFor}:{team.goalsAgainst}</div>
                <div>goals</div>
              </div>
            </div>

            {/* Stats - Desktop Layout */}
            <div className="hidden sm:contents">
              <div className="col-span-1 text-xs text-gray-600">{team.games}</div>
              <div className="col-span-1 text-xs text-gray-600">{team.wins}</div>
              <div className="col-span-1 text-xs text-gray-600">{team.draws}</div>
              <div className="col-span-1 text-xs text-gray-600">{team.losses}</div>
              <div className="col-span-2 text-xs text-gray-600">
                {team.goalsFor}:{team.goalsAgainst}
                {team.goalDifference !== 0 && (
                  <span className={`ml-1 ${team.goalDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ({team.goalDifference > 0 ? '+' : ''}{team.goalDifference})
                  </span>
                )}
              </div>
              <div className="col-span-1 text-sm font-medium text-gray-700">{team.points}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}