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

  // Set dynamic page title and meta tags
  usePageTitle(pageTitles.home(formattedDate))
  useMetaTags({
    title: pageTitles.home(formattedDate),
    description: `Swiss Unihockey games and live scores for ${format(selectedDate, 'MMMM d, yyyy')}. Track your favorite teams and follow live games.`,
    type: 'website'
  })

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
        ) : Object.keys(gamesByLeague).length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No games scheduled</h2>
            <p className="text-gray-600">
              There are no games scheduled for {format(selectedDate, 'MMMM d, yyyy')}.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(gamesByLeague)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([leagueName, leagueGames], index) => (
                <motion.div
                  key={leagueName}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <GameSection
                    title={leagueName}
                    games={leagueGames}
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