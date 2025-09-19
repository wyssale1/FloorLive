import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import LeagueTable from '../components/LeagueTable'
import LeagueTableSkeleton from '../components/LeagueTableSkeleton'
import CombinedLeagueSeasonSelector from '../components/CombinedLeagueSeasonSelector'
import { getCurrentSeasonYear } from '../lib/seasonUtils'
import { apiClient } from '../lib/apiClient'
import { usePageTitle, pageTitles } from '../hooks/usePageTitle'
import { useMetaTags } from '../hooks/useMetaTags'
import type { TeamRanking } from '../shared/types'

// League configuration based on API research
const LEAGUES = [
  {
    id: 'nla-men',
    label: 'NLA Men',
    shortLabel: 'NLA M',
    leagueId: '24',
    gameClass: '11',
    leagueName: 'L-UPL',
    apiName: 'Herren GF L-UPL'
  },
  {
    id: 'nla-women',
    label: 'NLA Women',
    shortLabel: 'NLA W',
    leagueId: '24',
    gameClass: '21',
    leagueName: 'L-UPL',
    apiName: 'Damen GF L-UPL'
  },
  {
    id: 'nlb-men',
    label: 'NLB Men',
    shortLabel: 'NLB M',
    leagueId: '2',
    gameClass: '11',
    leagueName: 'H',
    apiName: 'Herren GF NLB'
  },
  {
    id: 'nlb-women',
    label: 'NLB Women',
    shortLabel: 'NLB W',
    leagueId: '2',
    gameClass: '21',
    leagueName: 'D',
    apiName: 'Damen GF NLB'
  }
]

interface RankingsState {
  [key: string]: {
    table: {
      leagueId: string
      leagueName: string
      season: string
      standings: TeamRanking[]
    } | null
    loading: boolean
    error: string | null
  }
}

export default function Rankings() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/rankings' })

  // Get initial values from URL or defaults
  const getInitialLeague = useCallback(() => {
    if (search?.league && LEAGUES.find(l => l.id === search.league)) {
      return search.league
    }
    return 'nla-men' // default
  }, [search?.league])

  const getInitialYear = useCallback(() => {
    if (search?.year && /^\d{4}$/.test(search.year)) {
      return search.year
    }
    return getCurrentSeasonYear().toString() // default
  }, [search?.year])

  const [activeTab, setActiveTab] = useState(() => getInitialLeague())
  const [currentSeason, setCurrentSeason] = useState(() => getInitialYear())
  const [availableSeasons] = useState(['2025', '2024', '2023', '2022', '2021'])
  const [rankingsState, setRankingsState] = useState<RankingsState>(() => {
    // Initialize state for all leagues
    return LEAGUES.reduce((acc, league) => {
      acc[league.id] = {
        table: null,
        loading: false,
        error: null
      }
      return acc
    }, {} as RankingsState)
  })

  // Fetch rankings for a specific league
  const fetchRankings = async (leagueId: string, gameClass: string, season: string, leagueKey: string) => {
    setRankingsState(prev => ({
      ...prev,
      [leagueKey]: { ...prev[leagueKey], loading: true, error: null }
    }))

    try {
      const league = LEAGUES.find(l => l.id === leagueKey)

      // Use the correct leagueName from configuration
      const leagueName = league?.leagueName

      console.log(`Fetching rankings for ${leagueKey}:`, {
        season,
        league: leagueId,
        game_class: gameClass,
        leagueName
      })

      const rankingsData = await apiClient.getRankings({
        season,
        league: leagueId,
        game_class: gameClass,
        leagueName
      })

      console.log(`Rankings response for ${leagueKey}:`, rankingsData)

      if (rankingsData && rankingsData.standings && rankingsData.standings.standings) {
        const standingsData = rankingsData.standings
        console.log(`Successfully parsed standings for ${leagueKey}:`, standingsData.standings.length, 'teams')

        setRankingsState(prev => ({
          ...prev,
          [leagueKey]: {
            table: {
              leagueId,
              leagueName: standingsData.leagueName || league?.apiName || league?.label || 'Unknown League',
              season,
              standings: standingsData.standings
            },
            loading: false,
            error: null
          }
        }))
      } else {
        const errorMsg = `No rankings data found for ${leagueKey}. Response structure: ${JSON.stringify(rankingsData, null, 2)}`
        console.error(errorMsg)
        throw new Error(errorMsg)
      }
    } catch (error) {
      console.error(`Error fetching rankings for ${leagueKey}:`, error)
      setRankingsState(prev => ({
        ...prev,
        [leagueKey]: {
          table: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }))
    }
  }

  // Load rankings for active tab when tab or season changes
  useEffect(() => {
    const league = LEAGUES.find(l => l.id === activeTab)
    if (league) {
      fetchRankings(league.leagueId, league.gameClass, currentSeason, league.id)
    }
  }, [activeTab, currentSeason])

  // Handle season change
  const handleSeasonChange = useCallback((newSeason: string) => {
    setCurrentSeason(newSeason)
    // Update URL without triggering navigation
    navigate({
      to: '/rankings',
      search: { league: activeTab, year: newSeason },
      replace: true
    })
  }, [navigate, activeTab])

  // Handle league change
  const handleLeagueChange = useCallback((league: typeof LEAGUES[0]) => {
    setActiveTab(league.id)
    // Update URL without triggering navigation
    navigate({
      to: '/rankings',
      search: { league: league.id, year: currentSeason },
      replace: true
    })
  }, [navigate, currentSeason])

  // Update state when URL changes (back/forward navigation)
  useEffect(() => {
    const urlLeague = getInitialLeague()
    const urlYear = getInitialYear()

    if (urlLeague !== activeTab) {
      setActiveTab(urlLeague)
    }
    if (urlYear !== currentSeason) {
      setCurrentSeason(urlYear)
    }
  }, [search?.league, search?.year, activeTab, currentSeason, getInitialLeague, getInitialYear])

  // Get current league data
  const currentLeague = LEAGUES.find(l => l.id === activeTab)
  const currentData = rankingsState[activeTab]

  // Set dynamic page title and meta tags
  const pageTitle = pageTitles.rankings(currentLeague?.label || 'Swiss Unihockey', currentSeason)
  const pageDescription = `View ${currentLeague?.label || 'Swiss Unihockey'} league standings and team rankings for the ${currentSeason} season. Complete table with points, games played, and team statistics.`

  usePageTitle(pageTitle)
  useMetaTags({
    title: pageTitle,
    description: pageDescription,
    type: 'website',
    url: `https://floorlive.ch/rankings${activeTab !== 'nla-men' || currentSeason !== getCurrentSeasonYear().toString() ? `?league=${activeTab}&year=${currentSeason}` : ''}`
  })

  return (
    <div className="min-h-screen bg-gray-50/30 pt-4">
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Rankings</h1>
            {currentLeague && (
              <CombinedLeagueSeasonSelector
                currentLeague={currentLeague}
                currentSeason={currentSeason}
                availableLeagues={LEAGUES}
                availableSeasons={availableSeasons}
                onLeagueChange={handleLeagueChange}
                onSeasonChange={handleSeasonChange}
                disabled={currentData?.loading}
                loading={currentData?.loading}
              />
            )}
          </div>
        </motion.div>

        {/* Rankings Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentData?.loading ? (
                <LeagueTableSkeleton />
              ) : currentData?.error ? (
                <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-6">
                  <div className="text-center py-12">
                    <div className="text-red-600 text-sm mb-2">
                      Failed to load rankings: {currentData.error}
                    </div>
                    <button
                      onClick={() => {
                        if (currentLeague) {
                          fetchRankings(currentLeague.leagueId, currentLeague.gameClass, currentSeason, currentLeague.id)
                        }
                      }}
                      className="text-red-600 hover:text-red-800 text-sm font-medium underline"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              ) : (
                <LeagueTable
                  table={currentData?.table}
                  loading={false}
                  availableSeasons={availableSeasons}
                  onSeasonChange={handleSeasonChange}
                  seasonSelectorDisabled={currentData?.loading}
                  currentLeague={currentLeague}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}