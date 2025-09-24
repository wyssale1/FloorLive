import { useParams } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Users, Trophy, Target, Globe, User, Hash, Calendar } from 'lucide-react'
import { useState, useCallback, useMemo } from 'react'
import { getCurrentSeasonYear } from '../lib/seasonUtils'
import { extractLeagueId } from '../lib/utils'
import TeamLogo from '../components/TeamLogo'
import PlayerListSkeleton from '../components/PlayerListSkeleton'
import { Skeleton } from '../components/ui/skeleton'
import TabsContainer from '../components/TabsContainer'
import LeagueTable from '../components/LeagueTable'
import GameList from '../components/GameList'
import GameCardSkeleton from '../components/GameCardSkeleton'
import PlayerLink from '../components/PlayerLink'
import PlayerImage from '../components/PlayerImage'
import TeamPlayersLegend from '../components/TeamPlayersLegend'
import { usePageTitle, pageTitles } from '../hooks/usePageTitle'
import { useMetaTags, generateTeamMeta } from '../hooks/useMetaTags'
import { useTeamDetail, useTeamPlayers, useTeamStatistics, useTeamUpcomingGames, useRankings } from '../hooks/useQueries'
import { determineGameClass } from '../shared/types'

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
    Object.entries(categories).filter(([, players]) => players.length > 0)
  )
}

export default function TeamDetail() {
  const { teamId } = useParams({ from: '/team/$teamId' })
  const [selectedSeason, setSelectedSeason] = useState<string>('')

  // Use React Query hooks for all data fetching
  const { data: team, isLoading: teamLoading } = useTeamDetail(teamId)
  const { data: players = [], isLoading: playersLoading } = useTeamPlayers(teamId)
  const { data: statistics } = useTeamStatistics(teamId)
  const { data: upcomingGames = [], isLoading: gamesLoading } = useTeamUpcomingGames(teamId, false) // Lazy load
  

  // Set dynamic page title and meta tags when team data is loaded
  const pageTitle = team ? pageTitles.team(team.name) : 'Team Details'
  usePageTitle(pageTitle)

  const metaOptions = team ? generateTeamMeta({
    teamName: team.name,
    league: extractLeagueId(team.league) || undefined,
    logo: team.logo
  }) : {
    title: 'Team Details',
    description: 'Swiss Unihockey team information on FloorLive',
    type: 'website' as const
  }
  useMetaTags(metaOptions)

  // Calculate target season and league for rankings
  const targetSeason = selectedSeason || getCurrentSeasonYear().toString()
  const leagueId = useMemo(() => team ? extractLeagueId(team.league) : null, [team])

  // Use React Query for league rankings
  const {
    data: rankingsData,
    isLoading: rankingsLoading,
    isError: _rankingsError
  } = useRankings({
    season: targetSeason,
    league: leagueId || undefined,
    game_class: determineGameClass(team?.league?.name, players),
    leagueName: team?.league?.name,
    teamNames: team ? [team.name].filter(Boolean) : undefined
  }, !!team) // Enable rankings when team data is available

  // Transform rankings data to table format
  const leagueTables = useMemo(() => {
    if (!rankingsData || !team) return []

    const tableData = {
      leagueId: leagueId || 'general',
      leagueName: team.league?.name || 'League',
      season: targetSeason,
      standings: rankingsData.standings?.standings || [],
      currentTeamId: teamId
    }

    return [tableData]
  }, [rankingsData, team, leagueId, targetSeason, teamId])

  // Season change handler
  const handleSeasonChange = useCallback((newSeason: string) => {
    setSelectedSeason(newSeason)
  }, [])

  // Generate available seasons
  const availableSeasons = useCallback(() => {
    if (!team) return []

    const currentSeason = getCurrentSeasonYear()

    // Create seasons array from 3 years ago to current season
    const seasons = []
    const startYear = currentSeason - 3
    const endYear = currentSeason

    for (let year = endYear; year >= startYear; year--) {
      seasons.push(year.toString())
    }

    return seasons
  }, [team])


  // Lazy load upcoming games when tab is selected
  const { refetch: loadUpcomingGames } = useTeamUpcomingGames(teamId, false)
  
  if (teamLoading) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-6 max-w-7xl">
        {/* Team Header Skeleton */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 sm:mb-10"
        >
          <div className="flex items-start space-x-6 sm:space-x-8">
            {/* Logo skeleton */}
            <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex-shrink-0" />
            
            {/* Info skeleton */}
            <div className="flex flex-col justify-between min-h-16 sm:min-h-20 py-1">
              <Skeleton className="h-6 sm:h-8 w-48 sm:w-64 mb-2" />
              <Skeleton className="h-4 w-32 sm:w-40 mb-2" />
              <Skeleton className="h-4 w-24 sm:w-32" />
            </div>
          </div>
        </motion.div>

        {/* Content Skeleton */}
        <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-3 sm:p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <PlayerListSkeleton />
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
    <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-6 max-w-7xl">

      {/* Team Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 sm:mb-10"
      >
        <div className="flex items-start space-x-6 sm:space-x-8">
          {/* Logo - Left side */}
          <div className="flex-shrink-0">
            <TeamLogo 
              team={team} 
              size="large" 
              variant="square"
              showSwissUnihockeyFallback={true}
            />
          </div>
          
          {/* Info - Right side, aligned to logo height */}
          <div className="flex flex-col justify-between min-h-16 sm:min-h-20 py-1">
            {/* Team name at top */}
            <h1 className="text-2xl sm:text-3xl font-medium text-gray-800 leading-tight">
              {team.name}
            </h1>
            
            {/* League name in middle */}
            {team.league?.name && (
              <p className="text-sm text-gray-600 my-2 sm:my-3">{team.league.name}</p>
            )}
            
            {/* Website at bottom, aligned with logo bottom */}
            {team.website && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 mt-auto">
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
          </div>
        </div>
      </motion.div>

      {/* Team Content Tabs */}
      <TabsContainer
        defaultValue="players"
        tabs={[
          {
            value: 'players',
            label: 'Players',
            content: (
              <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-3 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <h2 className="text-lg font-medium text-gray-800">Squad</h2>
                    <span className="text-sm text-gray-500 ml-2">
                      {players.length} {players.length === 1 ? 'player' : 'players'}
                    </span>
                  </div>
                  {players.length > 0 && players.some(player => player.goals > 0 || player.assists > 0 || player.points > 0) && (
                    <TeamPlayersLegend />
                  )}
                </div>
                
                {playersLoading ? (
                  <PlayerListSkeleton />
                ) : players.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-sm mb-2">No player information available</div>
                    <div className="text-gray-500 text-xs">
                      Player roster may not be published yet.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupPlayersByPosition(players)).map(([category, categoryPlayers], categoryIndex) => (
                      <motion.div 
                        key={category} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: categoryIndex * 0.1 }}
                        className="space-y-3"
                      >
                        <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">
                          {category} ({categoryPlayers.length})
                        </h3>
                        <div className="space-y-0 divide-y divide-gray-100">
                          {categoryPlayers.map((player, playerIndex) => (
                            <motion.div
                              key={player.id || playerIndex}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: (categoryIndex * 0.1) + (playerIndex * 0.05) }}
                              className="flex items-center justify-between py-3 first:pt-0"
                            >
                              <div className="flex items-center space-x-3">
                                <PlayerImage 
                                  player={{
                                    id: player.id || '',
                                    name: player.name || '',
                                    profileImage: player.profileImage // Legacy fallback
                                  }}
                                  size="small"
                                  className="flex-shrink-0"
                                  imageInfo={player.imageInfo} // Pass image info from backend
                                  jerseyNumber={player.number}
                                  showNumberBadge={true}
                                />
                                <div className="min-w-0">
                                  <div className="text-xs font-medium text-gray-800">
                                    <PlayerLink 
                                      playerId={player.id && player.id.trim() ? player.id : ''} 
                                      playerName={player.name}
                                    />
                                  </div>
                                  {player.yearOfBirth && (
                                    <div className="text-xs text-gray-600">
                                      Born {player.yearOfBirth}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {(player.goals > 0 || player.assists > 0 || player.points > 0) && (
                                <div className="flex items-center space-x-3 text-xs text-gray-600 flex-shrink-0">
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
                      </motion.div>
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
              <div>
                {rankingsLoading ? (
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-6">
                    <div className="space-y-4">
                      <Skeleton className="h-6 w-48 mb-6" />
                      {Array(12).fill(0).map((_, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            <Skeleton className="w-6 h-6 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                          <div className="flex items-center space-x-4">
                            <Skeleton className="h-4 w-8" />
                            <Skeleton className="h-4 w-8" />
                            <Skeleton className="h-4 w-8" />
                            <Skeleton className="h-4 w-8" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : leagueTables.length === 0 ? (
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-6">
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-sm mb-2">League table not yet available</div>
                      <div className="text-gray-500 text-xs">
                        Tables are published after the first games of the season. Check back once the season has started.
                      </div>
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
                        <LeagueTable
                          table={table}
                          currentTeamId={teamId}
                          availableSeasons={availableSeasons()}
                          onSeasonChange={handleSeasonChange}
                          seasonSelectorDisabled={rankingsLoading}
                        />
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
            onTabSelect: () => loadUpcomingGames(),
            content: (
              <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-4 sm:p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <h2 className="text-lg font-medium text-gray-800">Upcoming Games</h2>
                  <span className="text-sm text-gray-500">
                    {upcomingGames.length} {upcomingGames.length === 1 ? 'game' : 'games'}
                  </span>
                </div>

                {gamesLoading ? (
                  <GameCardSkeleton variant="list" count={3} />
                ) : upcomingGames.length > 0 ? (
                  <GameList games={upcomingGames} showSeparators={true} showDate={true} noPaddingOnMobile={true} />
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-sm mb-1">No upcoming games scheduled</div>
                    <div className="text-gray-500 text-xs">
                      Check back later for future fixtures.
                    </div>
                  </div>
                )}
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
              className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-3 sm:p-6"
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
              className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-3 sm:p-6"
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