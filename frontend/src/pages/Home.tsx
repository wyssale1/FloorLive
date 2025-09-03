import { useState, useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import GameCard from '../components/GameCard'
import WeekPicker from '../components/WeekPicker'
import { apiClient } from '../lib/apiClient'
import { format, parseISO } from 'date-fns'

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

  const [selectedDate, setSelectedDate] = useState(getInitialDate)
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
        const response = await fetch(`http://localhost:3001/api/games?date=${dateString}`)
        
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
              logo: game.home_team.logo || getTeamEmoji(game.home_team.name)
            },
            awayTeam: {
              id: game.away_team.id,
              name: game.away_team.name,
              shortName: game.away_team.short_name,
              logo: game.away_team.logo || getTeamEmoji(game.away_team.name)
            },
            homeScore: game.home_score,
            awayScore: game.away_score,
            status: game.status,
            period: game.period,
            time: game.time,
            league: leagueName,
            startTime: game.start_time,
            gameDate: new Date(game.game_date),
            isLive: game.status === 'live'
          }))
          
          gamesByLeague[leagueName] = adaptedGames
          allGames.push(...adaptedGames)
        })
        
        setGames(allGames)
        setGamesByLeague(gamesByLeague)
        setLeaguesForDate(data.leagues || [])
        
      } catch (error) {
        console.error('Error fetching games:', error)
        setGames([])
        setGamesByLeague({})
        setLeaguesForDate([])
      } finally {
        setLoading(false)
      }
    }

    fetchGames()
  }, [selectedDate])
  
  // Helper function for team emojis
  const getTeamEmoji = (teamName: string): string => {
    const emojiMap: Record<string, string> = {
      'ZSC Lions': '🦁',
      'HC Davos': '🛡️',
      'Floorball Köniz': '⚫',
      'UHC Alligator Malans': '🐊',
      'Unihockey Basel Regio': '🏒',
      'SV Wiler-Ersigen': '⭐',
      'UHC Thun': '🏔️',
      'Floorball Thurgau': '🔵',
      'Grasshopper Club': '🦗',
      'UHC Dietlikon': '🔴'
    };
    return emojiMap[teamName] || '⚽';
  };
  
  const [gamesByLeague, setGamesByLeague] = useState<Record<string, any[]>>({})
  
  // Get leagues for rendering (use backend-provided order)
  const [leaguesForDate, setLeaguesForDate] = useState<string[]>([])
  
  const renderLeagueSection = (league: string, index: number) => {
    const leagueGames = gamesByLeague[league] || []
    
    if (leagueGames.length === 0) return null
    
    return (
      <motion.section
        key={league}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="mb-8"
      >
        <h2 className="text-lg font-medium text-gray-800 mb-4 px-1">
          {league}
          <span className="text-sm text-gray-500 ml-2">
            {leagueGames.length} {leagueGames.length === 1 ? 'game' : 'games'}
          </span>
        </h2>
        
        <div className="space-y-2">
          {leagueGames.map((game, gameIndex) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index * 0.1) + (gameIndex * 0.05) }}
            >
              <GameCard game={game} />
            </motion.div>
          ))}
        </div>
      </motion.section>
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
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">Loading games...</div>
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