import { useEffect } from 'react'

interface Organization {
  '@type': 'Organization'
  name: string
  url: string
  logo: string
  description: string
  sameAs: string[]
}

interface WebSite {
  '@type': 'WebSite'
  name: string
  url: string
  description: string
  potentialAction: {
    '@type': 'SearchAction'
    target: string
    'query-input': string
  }
}

interface SportsEvent {
  '@type': 'SportsEvent'
  name: string
  description: string
  startDate?: string
  endDate?: string
  location?: {
    '@type': 'Place'
    name: string
    address: string
  }
  competitor: Array<{
    '@type': 'SportsTeam'
    name: string
    logo?: string
  }>
  organizer: {
    '@type': 'Organization'
    name: string
    url: string
  }
  sport: string
  eventStatus?: string
  eventAttendanceMode?: string
}

interface SportsTeam {
  '@type': 'SportsTeam'
  name: string
  sport: string
  description: string
  logo?: string
  url: string
  memberOf?: {
    '@type': 'SportsOrganization'
    name: string
  }
}

type StructuredDataType = Organization | WebSite | SportsEvent | SportsTeam

/**
 * Hook for managing structured data (JSON-LD) for SEO
 */
export function useStructuredData(data: StructuredDataType | StructuredDataType[]) {
  useEffect(() => {
    const structuredData = Array.isArray(data) ? data : [data]

    // Create script element with JSON-LD
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': structuredData
    })

    // Add to head
    document.head.appendChild(script)

    // Cleanup on unmount
    return () => {
      if (script && script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [data])
}

/**
 * Generate organization structured data for FloorLive
 */
export const generateOrganizationData = (): Organization => ({
  '@type': 'Organization',
  name: 'FloorLive',
  url: 'https://floorlive.ch',
  logo: 'https://floorlive.ch/icons/apple-touch-icon-180x180.png',
  description: 'Swiss Unihockey live scores, results, and game tracking platform',
  sameAs: []
})

/**
 * Generate website structured data
 */
export const generateWebSiteData = (): WebSite => ({
  '@type': 'WebSite',
  name: 'FloorLive',
  url: 'https://floorlive.ch',
  description: 'Follow live Swiss Unihockey games, scores, and results. Track NLA, NLB teams and players.',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://floorlive.ch/search?q={search_term_string}',
    'query-input': 'required name=search_term_string'
  }
})

/**
 * Generate sports event structured data for games
 */
export const generateSportsEventData = (game: {
  id: string
  homeTeam: { name: string; logo?: string }
  awayTeam: { name: string; logo?: string }
  startTime?: string
  endTime?: string
  venue?: string
  status?: string
  league?: { name: string }
}): SportsEvent => {
  const eventStatus = game.status === 'live' ? 'https://schema.org/EventScheduled'
    : game.status === 'finished' ? 'https://schema.org/EventPostponed'
    : 'https://schema.org/EventScheduled'

  return {
    '@type': 'SportsEvent',
    name: `${game.homeTeam.name} vs ${game.awayTeam.name}`,
    description: `Swiss Unihockey match between ${game.homeTeam.name} and ${game.awayTeam.name}`,
    startDate: game.startTime,
    endDate: game.endTime,
    location: game.venue ? {
      '@type': 'Place',
      name: game.venue,
      address: 'Switzerland'
    } : undefined,
    competitor: [
      {
        '@type': 'SportsTeam',
        name: game.homeTeam.name,
        logo: game.homeTeam.logo
      },
      {
        '@type': 'SportsTeam',
        name: game.awayTeam.name,
        logo: game.awayTeam.logo
      }
    ],
    organizer: {
      '@type': 'Organization',
      name: 'Swiss Unihockey',
      url: 'https://swissunihockey.ch'
    },
    sport: 'Floorball',
    eventStatus,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode'
  }
}

/**
 * Generate sports team structured data
 */
export const generateSportsTeamData = (team: {
  id: string
  name: string
  logo?: string
  league?: { name: string }
}): SportsTeam => ({
  '@type': 'SportsTeam',
  name: team.name,
  sport: 'Floorball',
  description: `Swiss Unihockey team ${team.name}${team.league ? ` playing in ${team.league.name}` : ''}`,
  logo: team.logo,
  url: `https://floorlive.ch/team/${team.id}`,
  memberOf: team.league ? {
    '@type': 'SportsOrganization',
    name: team.league.name
  } : undefined
})

/**
 * Generate games list structured data for home page
 */
export const generateGamesListData = (games: Array<{
  id: string
  homeTeam: { name: string; logo?: string }
  awayTeam: { name: string; logo?: string }
  startTime?: string
  venue?: string
  status?: string
  league?: { name: string }
}>): SportsEvent[] => {
  return games.slice(0, 10).map(game => generateSportsEventData(game))
}