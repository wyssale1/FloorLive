import { useState, useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import GameCard from '../components/GameCard'
import WeekPicker from '../components/WeekPicker'
import { getGamesByDate, getLeaguesForDate, getGamesByLeague, type LeagueType } from '../lib/mockData'
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
  
  // Get games for selected date
  const gamesForDate = getGamesByDate(selectedDate)
  const leaguesForDate = getLeaguesForDate(selectedDate)
  
  const renderLeagueSection = (league: LeagueType, index: number) => {
    const leagueGames = getGamesByLeague(gamesForDate, league)
    
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
      {leaguesForDate.length > 0 ? (
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