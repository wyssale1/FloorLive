import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import LeagueTable from '../components/LeagueTable'
import LeagueTableSkeleton from '../components/LeagueTableSkeleton'
import SeasonSelector from '../components/SeasonSelector'
import { getCurrentSeasonYear, formatSeasonDisplay } from '../lib/seasonUtils'
import { apiClient } from '../lib/apiClient'
import type { TeamRanking } from '../shared/types'

// League configuration based on API research
const LEAGUES = [
  {
    id: 'nla-men',
    label: 'NLA Men',
    leagueId: '24',
    gameClass: '11',
    leagueName: 'L-UPL',
    apiName: 'Herren GF L-UPL'
  },
  {
    id: 'nla-women',
    label: 'NLA Women',
    leagueId: '24',
    gameClass: '21',
    leagueName: 'L-UPL',
    apiName: 'Damen GF L-UPL'
  },
  {
    id: 'nlb-men',
    label: 'NLB Men',
    leagueId: '2',
    gameClass: '11',
    leagueName: 'H',
    apiName: 'Herren GF NLB'
  },
  {
    id: 'nlb-women',
    label: 'NLB Women',
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
  const [activeTab, setActiveTab] = useState('nla-men')
  const [currentSeason, setCurrentSeason] = useState(getCurrentSeasonYear().toString())
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
  const handleSeasonChange = (newSeason: string) => {
    setCurrentSeason(newSeason)
  }

  // Get current league data
  const currentLeague = LEAGUES.find(l => l.id === activeTab)
  const currentData = rankingsState[activeTab]

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
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded">
              {formatSeasonDisplay(parseInt(currentSeason))}
            </span>
          </div>
        </motion.div>

        {/* League Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-white/60 backdrop-blur-sm border border-gray-100">
              {LEAGUES.map((league) => (
                <TabsTrigger
                  key={league.id}
                  value={league.id}
                  className="text-sm font-medium"
                >
                  {league.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {LEAGUES.map((league) => (
                <TabsContent
                  key={league.id}
                  value={league.id}
                  className="mt-0"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {rankingsState[league.id].loading ? (
                      <LeagueTableSkeleton />
                    ) : rankingsState[league.id].error ? (
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-6">
                        <div className="text-center py-12">
                          <div className="text-red-600 text-sm mb-2">
                            Failed to load rankings: {rankingsState[league.id].error}
                          </div>
                          <button
                            onClick={() => fetchRankings(league.leagueId, league.gameClass, currentSeason, league.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium underline"
                          >
                            Try again
                          </button>
                        </div>
                      </div>
                    ) : (
                      <LeagueTable
                        table={rankingsState[league.id].table}
                        loading={false}
                        availableSeasons={availableSeasons}
                        onSeasonChange={handleSeasonChange}
                        seasonSelectorDisabled={rankingsState[league.id].loading}
                      />
                    )}
                  </motion.div>
                </TabsContent>
              ))}
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}