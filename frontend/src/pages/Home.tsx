import { useState, useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import GameSection from '../components/GameSection'
import GameCardSkeleton from '../components/GameCardSkeleton'
import WeekPicker from '../components/WeekPicker'
import { format, parseISO } from 'date-fns'
import { usePageTitle, pageTitles } from '../hooks/usePageTitle'
import { useMetaTags } from '../hooks/useMetaTags'

export default function Home() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/' })
  
  // Get date from URL or default to today
  const getInitialDate = () => {
    if (search?.date && typeof search.date === 'string') {
      try {
        return parseISO(search.date)
      } catch {
        return new Date()
      }
    }
    return new Date()
  }

  const [selectedDate, setSelectedDate] = useState(() => getInitialDate())
  const [loading, setLoading] = useState(true)

  // Set dynamic page title and meta tags
  const formattedDate = format(selectedDate, 'yyyy-MM-dd')
  usePageTitle(pageTitles.home(formattedDate))
  useMetaTags({
    title: pageTitles.home(formattedDate),
    description: `Swiss Unihockey games and live scores for ${format(selectedDate, 'MMMM d, yyyy')}. Track your favorite teams and follow live games.`,
    type: 'website'
  })

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    // Update URL with selected date
    navigate({
      to: '/',
      search: { date: format(date, 'yyyy-MM-dd') }
    })
  }

  // Update state when URL changes
  useEffect(() => {
    const newDate = getInitialDate()
    if (newDate.getTime() !== selectedDate.getTime()) {
      setSelectedDate(newDate)
    }
  }, [search?.date])
  
  // Fetch games when date changes
  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true)
      try {
        const dateString = format(selectedDate, 'yyyy-MM-dd')
        // Dynamic API URL detection for Tailscale development
        const getApiBaseUrl = () => {
          // First check if explicitly set via environment
          if (import.meta.env.VITE_API_URL) {
            return import.meta.env.VITE_API_URL;
          }
          
          // In development, detect if we're running on Tailscale network
          if (import.meta.env.DEV) {
            const currentHost = window.location.hostname;
            
            // Check if we're on a network IP (not localhost)
            if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
              // Use Tailscale IP for backend
              return `http://100.99.89.57:3001/api`;
            }
          }
          
          // Default fallback
          return 'http://localhost:3001/api';
        };
        
        const API_BASE_URL = getApiBaseUrl();
        const response = await fetch(`${API_BASE_URL}/games?date=${dateString}`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Convert backend format to frontend format, preserving league structure
        const allGames: any[] = []
        const gamesByLeague: Record<string, any[]> = {}
        
        Object.entries(data.gamesByLeague).forEach(([leagueName, games]: [string, any]) => {
          const adaptedGames = games.map((game: any) => ({
            id: game.id,
            homeTeam: {
              id: game.home_team.id,
              name: game.home_team.name,
              shortName: game.home_team.short_name,
              logo: game.home_team.logo,
              logoUrls: game.home_team.logoUrls
            },
            awayTeam: {
              id: game.away_team.id,
              name: game.away_team.name,
              shortName: game.away_team.short_name,
              logo: game.away_team.logo,
              logoUrls: game.away_team.logoUrls
            },
            homeScore: game.home_score,
            awayScore: game.away_score,
            status: game.status,
            period: game.period,
            time: game.time,
            league: leagueName,
            startTime: game.start_time,
            gameDate: game.game_date,
            isLive: game.status === 'live'
          }))
          
          gamesByLeague[leagueName] = adaptedGames
          allGames.push(...adaptedGames)
        })
        
        setGamesByLeague(gamesByLeague)
        setLeaguesForDate(data.leagues || [])
        
      } catch (error) {
        console.error('Error fetching games:', error)
        setGamesByLeague({})
        setLeaguesForDate([])
      } finally {
        setLoading(false)
      }
    }

    fetchGames()
  }, [selectedDate])
  
  
  const [gamesByLeague, setGamesByLeague] = useState<Record<string, any[]>>({})
  
  // Get leagues for rendering (use backend-provided order)
  const [leaguesForDate, setLeaguesForDate] = useState<string[]>([])
  
  const renderLeagueSection = (league: string, index: number) => {
    const leagueGames = gamesByLeague[league] || []
    
    return (
      <GameSection
        key={league}
        title={league}
        games={leagueGames}
        index={index}
      />
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Week Picker */}
      <WeekPicker 
        selectedDate={selectedDate} 
        onDateSelect={handleDateSelect}
      />
      
      {/* Games by League */}
      {loading ? (
        <div className="space-y-8">
          {/* Skeleton for different leagues */}
          {Array(3).fill(0).map((_, leagueIndex) => (
            <motion.section
              key={`skeleton-league-${leagueIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: leagueIndex * 0.1 }}
            >
              <GameCardSkeleton 
                variant="section" 
                count={leagueIndex === 0 ? 4 : leagueIndex === 1 ? 3 : 2} 
              />
            </motion.section>
          ))}
        </div>
      ) : leaguesForDate.length > 0 ? (
        <div>
          {leaguesForDate.map((league, index) => renderLeagueSection(league, index))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-gray-400 text-lg mb-2">No games scheduled</div>
          <div className="text-gray-500 text-sm">
            Try selecting a different date
          </div>
        </motion.div>
      )}
    </div>
  )
}