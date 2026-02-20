import { useParams } from '@tanstack/react-router'
import { m } from 'framer-motion'
import { Globe } from 'lucide-react'
import { useState, useCallback, useMemo } from 'react'
import { getCurrentSeasonYear } from '../lib/seasonUtils'
import { mapLeagueForRankings } from '../lib/utils'
import TeamLogo from '../components/TeamLogo'
import PlayerListSkeleton from '../components/PlayerListSkeleton'
import { Skeleton } from '../components/ui/skeleton'
import TabsContainer from '../components/TabsContainer'
import ChemistryAnalysisTab from '../components/ChemistryAnalysisTab'
import TeamPlayersTab from '../components/team/TeamPlayersTab'
import TeamLeagueTablesTab from '../components/team/TeamLeagueTablesTab'
import TeamUpcomingGamesTab from '../components/team/TeamUpcomingGamesTab'
import { usePageTitle, pageTitles } from '../hooks/usePageTitle'
import { useMetaTags, generateTeamMeta } from '../hooks/useMetaTags'
import { useTeamDetail, useTeamPlayers, useTeamUpcomingGames } from '../hooks/queries/useTeamQueries'
import { useRankings } from '../hooks/queries/useRankingQueries'
import { determineGameClass } from '../types/api'



export default function TeamDetail() {
  const { teamId } = useParams({ from: '/team/$teamId' })
  const [selectedSeason, setSelectedSeason] = useState<string>('')

  // Use React Query hooks for all data fetching
  const { data: team, isLoading: teamLoading } = useTeamDetail(teamId)
  const { data: players = [], isLoading: playersLoading } = useTeamPlayers(teamId)
  const { data: upcomingGames = [], isLoading: gamesLoading } = useTeamUpcomingGames(teamId, false) // Lazy load


  // Set dynamic page title and meta tags when team data is loaded
  const pageTitle = team ? pageTitles.team(team.name) : 'Team Details'
  usePageTitle(pageTitle)

  // Map league to correct rankings parameters (fixes NLB issue)
  const leagueParams = useMemo(() => team ? mapLeagueForRankings(team.league) : null, [team])

  const metaOptions = team ? generateTeamMeta({
    teamName: team.name,
    league: leagueParams?.league || undefined,
    logo: team.logo
  }) : {
    title: 'Team Details',
    description: 'Swiss Unihockey team information on FloorLive',
    type: 'website' as const
  }
  useMetaTags(metaOptions)

  // Calculate target season and league for rankings
  const targetSeason = selectedSeason || getCurrentSeasonYear().toString()

  // Use React Query for league rankings
  const {
    data: rankingsData,
    isLoading: rankingsLoading
  } = useRankings({
    season: targetSeason,
    league: leagueParams?.league,
    game_class: determineGameClass(team?.league?.name, players),
    leagueName: leagueParams?.leagueName,
    teamNames: team ? [team.name].filter(Boolean) : undefined
  }, !!team && !!leagueParams) // Enable rankings when team data is available

  // Transform rankings data to table format
  const leagueTables = useMemo(() => {
    if (!rankingsData || !team) return []

    const tableData = {
      leagueId: leagueParams?.league || 'general',
      leagueName: team.league?.name || 'League',
      season: targetSeason,
      standings: rankingsData.standings?.standings || [],
      currentTeamId: teamId
    }

    return [tableData]
  }, [rankingsData, team, leagueParams, targetSeason, teamId])

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
        <m.div
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
        </m.div>

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
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 sm:mb-10"
      >
        <div className="flex items-start space-x-6 sm:space-x-8">
          {/* Logo - Left side */}
          <div className="flex-shrink-0">
            <TeamLogo
              team={team}
              size="medium"
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
      </m.div>

      {/* Team Content Tabs */}
      <TabsContainer
        defaultValue="players"
        tabs={[
          {
            value: 'players',
            label: 'Players',
            content: (
              <TeamPlayersTab players={players} isLoading={playersLoading} />
            )
          },
          {
            value: 'tables',
            label: 'League Tables',
            content: (
              <TeamLeagueTablesTab
                isLoading={rankingsLoading}
                leagueTables={leagueTables}
                teamId={teamId}
                availableSeasons={availableSeasons()}
                onSeasonChange={handleSeasonChange}
              />
            )
          },
          {
            value: 'analysis',
            label: 'Analysis',
            content: (
              <ChemistryAnalysisTab teamId={teamId} />
            )
          },
          {
            value: 'games',
            label: 'Upcoming Games',
            onTabSelect: () => loadUpcomingGames(),
            content: (
              <TeamUpcomingGamesTab games={upcomingGames} isLoading={gamesLoading} />
            )
          }
        ]}
      />

      {/* Team Portrait below tabs */}
      {team.portrait && (
        <div className="mt-6">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-3 sm:p-6"
          >
            <h2 className="text-lg font-medium text-gray-800 mb-4">About the Team</h2>
            <div className="text-sm text-gray-600 leading-relaxed">
              {team.portrait}
            </div>
          </m.div>
        </div>
      )}
    </div>
  )
}