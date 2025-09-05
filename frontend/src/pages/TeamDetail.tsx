import { useParams } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Users, Trophy, Target, Globe, User, Hash } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apiClient } from '../lib/apiClient'
import TeamLogo from '../components/TeamLogo'
import TabsContainer from '../components/TabsContainer'
import LeagueTable from '../components/LeagueTable'
import UpcomingGames from '../components/UpcomingGames'

function groupPlayersByPosition(players: any[]) {
  const categories = {
    'Goalies': [] as any[],
    'Defenders': [] as any[],
    'Forwards': [] as any[],
    'Additional Players': [] as any[]
  }

  players.forEach(player => {
    const position = player.position?.toLowerCase() || ''
    if (position.includes('goalie')) {
      categories['Goalies'].push(player)
    } else if (position.includes('verteidiger')) {
      categories['Defenders'].push(player)
    } else if (position.includes('stürmer')) {
      categories['Forwards'].push(player)
    } else {
      categories['Additional Players'].push(player)
    }
  })

  // Only return categories that have players
  return Object.fromEntries(
    Object.entries(categories).filter(([_, players]) => players.length > 0)
  )
}

export default function TeamDetail() {
  const { teamId } = useParams({ from: '/team/$teamId' })
  const [team, setTeam] = useState<any>(null)
  const [players, setPlayers] = useState<any[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [upcomingGames, setUpcomingGames] = useState<any[]>([])
  const [leagueTables, setLeagueTables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tabsLoading, setTabsLoading] = useState({
    players: false,
    tables: false,
    games: false
  })
  
  useEffect(() => {
    const fetchTeamData = async () => {
      setLoading(true)
      try {
        const teamData = await apiClient.getTeamDetails(teamId)
        setTeam(teamData)
        
        // Initial load of players (for default tab)
        setTabsLoading(prev => ({ ...prev, players: true }))
        const playersData = await apiClient.getTeamPlayers(teamId)
        setPlayers(playersData)
        setTabsLoading(prev => ({ ...prev, players: false }))
        
        // Also load statistics for team info
        const statsData = await apiClient.getTeamStatistics(teamId)
        setStatistics(statsData)
      } catch (error) {
        console.error('Error fetching team data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchTeamData()
  }, [teamId])

  const loadLeagueTables = async () => {
    if (leagueTables.length > 0) return // Already loaded
    
    setTabsLoading(prev => ({ ...prev, tables: true }))
    try {
      // For now, get current season rankings since we don't have historical team data
      // In the future, we could extract season from team's last game or allow user selection
      const rankingsData = await apiClient.getRankings()
      
      if (rankingsData) {
        setLeagueTables([rankingsData])
      } else {
        // Fallback: try the old approach if rankings fail
        const competitionsData = await apiClient.getTeamCompetitions(teamId)
        
        const tablePromises = competitionsData.map(async (competition: any) => {
          try {
            const rankingsForCompetition = await apiClient.getRankings({ 
              league: competition.id 
            })
            return rankingsForCompetition
          } catch (error) {
            console.error(`Error loading rankings for ${competition.name}:`, error)
            return null
          }
        })
        
        const tables = await Promise.all(tablePromises)
        setLeagueTables(tables.filter(table => table !== null))
      }
    } catch (error) {
      console.error('Error fetching league tables:', error)
    } finally {
      setTabsLoading(prev => ({ ...prev, tables: false }))
    }
  }

  const loadUpcomingGames = async () => {
    if (upcomingGames.length > 0) return // Already loaded
    
    setTabsLoading(prev => ({ ...prev, games: true }))
    try {
      const gamesData = await apiClient.getTeamUpcomingGames(teamId)
      setUpcomingGames(gamesData)
    } catch (error) {
      console.error('Error fetching upcoming games:', error)
    } finally {
      setTabsLoading(prev => ({ ...prev, games: false }))
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">Loading team details...</div>
        </div>
      </div>
    )
  }
  
  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Not Found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">

      {/* Team Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/50 backdrop-blur-sm rounded-lg border border-gray-100 p-6 mb-6"
      >
        <div className="flex items-center space-x-4 mb-4">
          <TeamLogo 
            team={team} 
            size="large" 
            className="w-16 h-16 sm:w-20 sm:h-20"
            showSwissUnihockeyFallback={true}
          />
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium text-gray-800 mb-1">
              {team.name}
            </h1>
            {team.league?.name && (
              <p className="text-sm text-gray-600">{team.league.name}</p>
            )}
          </div>
        </div>
        
        {team.website && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Globe className="w-4 h-4" />
            <a 
              href={team.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              Team Website
            </a>
          </div>
        )}
      </motion.div>

      {/* Team Content Tabs */}
      <TabsContainer
        defaultValue="players"
        tabs={[
          {
            value: 'players',
            label: 'Players',
            content: (
              <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Users className="w-4 h-4 text-gray-600" />
                  <h2 className="text-lg font-medium text-gray-800">Current Roster</h2>
                  <span className="text-sm text-gray-500 ml-2">
                    {players.length} {players.length === 1 ? 'player' : 'players'}
                  </span>
                </div>
                
                {tabsLoading.players ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-sm">Loading players...</div>
                  </div>
                ) : players.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-sm mb-2">No player information available</div>
                    <div className="text-gray-500 text-xs">
                      Player roster may not be published yet.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupPlayersByPosition(players)).map(([category, categoryPlayers]) => (
                      <div key={category} className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
                          {category} ({categoryPlayers.length})
                        </h3>
                        <div className="space-y-2">
                          {categoryPlayers.map((player, index) => (
                            <motion.div
                              key={player.id || index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.02 }}
                              className="flex items-center justify-between p-3 bg-white/40 rounded-lg border border-gray-100"
                            >
                              <div className="flex items-center space-x-3">
                                {player.number && (
                                  <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                                    <span className="text-xs font-medium text-gray-700">
                                      {player.number}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <div className="text-sm font-medium text-gray-800">
                                    {player.name}
                                  </div>
                                  {player.yearOfBirth && (
                                    <div className="text-xs text-gray-600">
                                      Born {player.yearOfBirth}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {(player.goals > 0 || player.assists > 0 || player.points > 0) && (
                                <div className="flex items-center space-x-4 text-xs text-gray-600">
                                  {player.goals > 0 && (
                                    <div className="flex items-center space-x-1">
                                      <Target className="w-3 h-3" />
                                      <span>{player.goals}</span>
                                    </div>
                                  )}
                                  {player.assists > 0 && (
                                    <div className="flex items-center space-x-1">
                                      <User className="w-3 h-3" />
                                      <span>{player.assists}</span>
                                    </div>
                                  )}
                                  {player.points > 0 && (
                                    <div className="flex items-center space-x-1">
                                      <Hash className="w-3 h-3" />
                                      <span>{player.points}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          },
          {
            value: 'tables',
            label: 'League Tables',
            content: (
              <div
                onFocus={() => loadLeagueTables()}
                onClick={() => loadLeagueTables()}
              >
                {tabsLoading.tables ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-sm">Loading league tables...</div>
                  </div>
                ) : leagueTables.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-sm mb-2">No league tables available</div>
                    <div className="text-gray-500 text-xs">
                      League standings may not be available for this team's competitions.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {leagueTables.map((table, index) => (
                      <motion.div
                        key={table?.leagueId || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <LeagueTable table={table} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )
          },
          {
            value: 'games',
            label: 'Upcoming Games',
            content: (
              <div
                onFocus={() => loadUpcomingGames()}
                onClick={() => loadUpcomingGames()}
              >
                <UpcomingGames 
                  games={upcomingGames} 
                  loading={tabsLoading.games}
                />
              </div>
            )
          }
        ]}
      />

      {/* Team Statistics and Portrait below tabs */}
      {(statistics || team.portrait) && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Statistics */}
          {statistics && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-6"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Trophy className="w-4 h-4 text-gray-600" />
                <h2 className="text-lg font-medium text-gray-800">Team History</h2>
              </div>

              {/* Achievements */}
              {statistics.achievements && statistics.achievements.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Achievements</h3>
                  <div className="space-y-2">
                    {statistics.achievements.slice(0, 5).map((achievement: any, index: number) => (
                      <div key={index} className="p-3 bg-white/40 rounded-lg border border-gray-100">
                        <div className="text-sm font-medium text-gray-800">
                          {achievement.competition}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {achievement.season} - {achievement.result}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Season Statistics */}
              {statistics.seasons && statistics.seasons.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Seasons</h3>
                  <div className="space-y-2">
                    {statistics.seasons.slice(0, 3).map((season: any, index: number) => (
                      <div key={index} className="p-3 bg-white/40 rounded-lg border border-gray-100">
                        <div className="text-sm font-medium text-gray-800">
                          {season.season}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {season.league}
                        </div>
                        {season.position && (
                          <div className="text-xs text-gray-500 mt-1">
                            Position: {season.position}
                          </div>
                        )}
                        {(season.games > 0 || season.wins > 0) && (
                          <div className="text-xs text-gray-500 mt-1">
                            {season.games} games • {season.wins} wins
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Team Portrait */}
          {team.portrait && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-6"
            >
              <h2 className="text-lg font-medium text-gray-800 mb-4">About the Team</h2>
              <div className="text-sm text-gray-600 leading-relaxed">
                {team.portrait}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}