import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import GameSection from '../components/GameSection'
import GameCardSkeleton from '../components/GameCardSkeleton'
import WeekPicker from '../components/WeekPicker'
import { format, parseISO } from 'date-fns'
import { usePageTitle, pageTitles } from '../hooks/usePageTitle'
import { useMetaTags } from '../hooks/useMetaTags'
import { useGamesByDate } from '../hooks/useQueries'
import { useStructuredData, generateWebSiteData, generateOrganizationData, generateGamesListData } from '../hooks/useStructuredData'

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

  // League ordering preferences (same as backend)
  const LEAGUE_ORDER_PREFERENCES = [
    'Herren L-UPL',    // NLA Men
    'Damen L-UPL',     // NLA Women
    'Herren NLB',      // NLB Men
    'Damen NLB'        // NLB Women
  ]

  // Group games by league (memoized)
  const gamesByLeague = useMemo(() => {
    const grouped: Record<string, any[]> = {}

    games.forEach((game: { league?: { name?: string } }) => {
      const leagueName = game.league?.name || 'Unknown League'
      if (!grouped[leagueName]) {
        grouped[leagueName] = []
      }
      grouped[leagueName].push(game)
    })

    return grouped
  }, [games])

  // Get ordered league names (memoized)
  const orderedLeagueNames = useMemo(() => {
    const leagueNames = Object.keys(gamesByLeague)

    return [
      // First, add leagues in preferred order (only if they have games)
      ...LEAGUE_ORDER_PREFERENCES.filter(league => leagueNames.includes(league)),
      // Then add remaining leagues alphabetically
      ...leagueNames.filter(league => !LEAGUE_ORDER_PREFERENCES.includes(league)).sort()
    ]
  }, [gamesByLeague, LEAGUE_ORDER_PREFERENCES])

  // Set dynamic page title and meta tags
  usePageTitle(pageTitles.home(formattedDate))
  useMetaTags({
    title: pageTitles.home(formattedDate),
    description: `Swiss Unihockey games and live scores for ${format(selectedDate, 'MMMM d, yyyy')}. Track your favorite teams and follow live games.`,
    type: 'website',
    url: `https://floorlive.ch${search?.date ? `?date=${search.date}` : ''}`
  })

  // Add structured data for SEO
  useStructuredData([
    generateOrganizationData(),
    generateWebSiteData(),
    ...generateGamesListData(games.filter(game => game.home_team && game.away_team).map(game => ({
      id: game.id,
      homeTeam: { name: game.home_team.name, logo: game.home_team.logo },
      awayTeam: { name: game.away_team.name, logo: game.away_team.logo },
      startTime: game.start_time,
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
    const newDate = getInitialDate()
    if (newDate.getTime() !== selectedDate.getTime()) {
      setSelectedDate(newDate)
    }
  }, [search?.date, selectedDate, getInitialDate])

  if (isError) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-6 max-w-7xl">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Unable to load games</h2>
          <p className="text-gray-600 mb-4">
            There was an error loading games for {format(selectedDate, 'MMMM d, yyyy')}.
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-4 sm:mb-6"
      >
        <WeekPicker
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />
      </motion.div>

      {/* Games Content */}
      <motion.div
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
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No games scheduled</h2>
            <p className="text-gray-600">
              There are no games scheduled for {format(selectedDate, 'MMMM d, yyyy')}.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orderedLeagueNames.map((leagueName, index) => (
                <motion.div
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
                </motion.div>
              ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}