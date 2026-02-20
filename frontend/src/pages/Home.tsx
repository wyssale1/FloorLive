import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { m } from 'framer-motion'
import GameSection from '../components/GameSection'
import GameCardSkeleton from '../components/GameCardSkeleton'
import WeekPicker from '../components/WeekPicker'
import ExpandableLeagueSection from '../components/ExpandableLeagueSection'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import { format, parseISO } from 'date-fns'
import { usePageTitle, pageTitles } from '../hooks/usePageTitle'
import { useMetaTags } from '../hooks/useMetaTags'
import { useGamesByDate } from '../hooks/queries/useGameQueries'
import { useLeagueConfig } from '../hooks/queries/useLeagueQueries'
import { useNextGameFinder } from '../hooks/useNextGameFinder'
import { useStructuredData, generateWebSiteData, generateOrganizationData, generateGamesListData } from '../hooks/useStructuredData'
import { useLeagueProcessing } from '../hooks/useLeagueProcessing'

export default function Home() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/' })

  // Get date from URL or default to today
  const getInitialDate = useCallback(() => {
    if (search?.date && typeof search.date === 'string') {
      try {
        return parseISO(search.date)
      } catch {
        return new Date()
      }
    }
    return new Date()
  }, [search?.date])

  const [selectedDate, setSelectedDate] = useState(() => getInitialDate())

  // Format date for API call
  const formattedDate = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate])

  // Use React Query for games data
  const { data: games = [], isLoading, isError } = useGamesByDate(formattedDate)

  // Fetch league configuration for expandable lower tier sections
  const { data: leagueConfig } = useLeagueConfig()

  // Find next date with games (only when no games for current date)
  const shouldSearchForNextGames = !isLoading && games.length === 0
  const { data: nextGameData } = useNextGameFinder(
    selectedDate,
    shouldSearchForNextGames
  )

  const {
    genderFilter,
    setGenderFilter,
    filteredLowerTierLeagues,
    gamesByLeague,
    orderedLeagueNames
  } = useLeagueProcessing(games, leagueConfig)

  // Set dynamic page title and meta tags
  usePageTitle(pageTitles.home(formattedDate))
  useMetaTags({
    title: pageTitles.home(formattedDate),
    description: `Swiss Unihockey games and live scores for ${format(selectedDate, 'd. MMMM yyyy')}. Track your favorite teams and follow live games.`,
    type: 'website',
    url: `https://floorlive.ch${search?.date ? `?date=${search.date}` : ''}`
  })

  // Add structured data for SEO
  useStructuredData([
    generateOrganizationData(),
    generateWebSiteData(),
    ...generateGamesListData(games.filter(game => game.homeTeam && game.awayTeam).map(game => ({
      id: game.id,
      homeTeam: { name: game.homeTeam.name, logo: game.homeTeam.logo },
      awayTeam: { name: game.awayTeam.name, logo: game.awayTeam.logo },
      startTime: game.startTime,
      venue: game.venue?.name || game.location,
      status: game.status,
      league: game.league
    })))
  ])

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date)
    // Update URL with selected date
    navigate({
      to: '/',
      search: { date: format(date, 'yyyy-MM-dd') }
    })
  }, [navigate])

  // Update state when URL changes
  useEffect(() => {
    if (search?.date && typeof search.date === 'string') {
      try {
        const newDate = parseISO(search.date)
        if (newDate.getTime() !== selectedDate.getTime()) {
          setSelectedDate(newDate)
        }
      } catch {
        // Invalid date, fallback to current date
        const today = new Date()
        if (today.getTime() !== selectedDate.getTime()) {
          setSelectedDate(today)
        }
      }
    }
  }, [search?.date])

  if (isError) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-6 max-w-7xl">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to load games</h2>
          <p className="text-gray-600 mb-4">
            There was an error loading games for {format(selectedDate, 'd. MMMM yyyy')}.
          </p>
          <p className="text-sm text-gray-500">
            Please check your connection and try again.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-6 max-w-7xl">
      {/* Week Navigation */}
      <m.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-4 sm:mb-6"
      >
        <WeekPicker
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />
      </m.div>

      {/* Games Content */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {isLoading ? (
          <div className="space-y-6">
            <GameCardSkeleton variant="section" />
            <GameCardSkeleton variant="section" />
            <GameCardSkeleton variant="section" />
          </div>
        ) : orderedLeagueNames.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">No games scheduled</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                There are no games scheduled for {format(selectedDate, 'd. MMMM yyyy')}.
              </p>

              {/* Next Games Button - Integrated in empty state */}
              {nextGameData && (
                <m.div
                  initial={{ opacity: 0, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <button
                    onClick={() => handleDateSelect(nextGameData.date)}
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium px-4 py-2 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-300"
                  >
                    Next Games on {format(nextGameData.date, 'd. MMMM')}
                  </button>
                </m.div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top-tier leagues (auto-expanded with games from API) */}
            {orderedLeagueNames.map((leagueName, index) => (
              <m.div
                key={leagueName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <GameSection
                  title={leagueName}
                  games={gamesByLeague[leagueName]}
                  index={index}
                />
              </m.div>
            ))}

            {/* Lower-tier leagues (expandable, lazy-loaded) */}
            {leagueConfig?.lowerTier && leagueConfig.lowerTier.length > 0 && (
              <>
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-500 px-1">
                      Weitere Ligen
                    </h3>
                    <Tabs value={genderFilter} onValueChange={(value) => setGenderFilter(value as 'Herren' | 'Damen')}>
                      <TabsList>
                        <TabsTrigger value="Herren">Herren</TabsTrigger>
                        <TabsTrigger value="Damen">Damen</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>
                {filteredLowerTierLeagues.map((leagueGroup: any, index: number) => (
                  <ExpandableLeagueSection
                    key={`${leagueGroup.id}-${leagueGroup.gameClass}-${leagueGroup.group || 'all'}`}
                    leagueGroup={leagueGroup}
                    date={formattedDate}
                    index={index}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </m.div>
    </div>
  )
}