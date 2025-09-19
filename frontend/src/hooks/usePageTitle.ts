import { useEffect } from 'react'

interface PageTitleOptions {
  title: string
  description?: string
  suffix?: string
}

/**
 * Custom hook for managing dynamic page titles
 * Automatically updates document title and provides SEO-friendly formatting
 */
export function usePageTitle(options: string | PageTitleOptions) {
  useEffect(() => {
    // Handle string parameter for backward compatibility
    if (typeof options === 'string') {
      document.title = `${options} | FloorLive`
      return
    }

    // Handle object parameter with more options
    const { title, suffix = 'FloorLive' } = options
    const fullTitle = suffix ? `${title} | ${suffix}` : title
    
    document.title = fullTitle

    // Cleanup - reset to default title when component unmounts
    return () => {
      document.title = 'FloorLive - Swiss Unihockey Tracker'
    }
  }, [options])
}

/**
 * Utility functions for generating consistent page titles
 */
export const pageTitles = {
  home: (date?: string) => 
    date ? `Swiss Unihockey Games - ${date}` : 'Live Swiss Unihockey Scores & Results',
  
  game: (homeTeam: string, awayTeam: string, status?: string) => {
    const statusText = status === 'live' ? ' - Live' : ''
    return `${homeTeam} - ${awayTeam}${statusText}`
  },
  
  team: (teamName: string) => teamName,
  
  player: (playerName: string) => playerName,

  rankings: (leagueName: string, season: string) =>
    `${leagueName} Rankings ${season}`,

  error: 'Page Not Found',

  loading: (type: 'game' | 'team' | 'player' | 'rankings') => `Loading ${type}...`
}

export default usePageTitle