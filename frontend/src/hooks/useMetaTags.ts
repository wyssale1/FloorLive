import { useEffect } from 'react'

interface MetaTagsOptions {
  title: string
  description: string
  image?: string
  url?: string
  type?: 'website' | 'article'
  twitterCard?: 'summary' | 'summary_large_image'
}

interface GameMetaOptions {
  homeTeam: string
  awayTeam: string
  homeScore?: number | null
  awayScore?: number | null
  status: 'live' | 'upcoming' | 'finished'
  startTime?: string
  gameDate?: string
}

interface TeamMetaOptions {
  teamName: string
  league?: string
  logo?: string
}

interface PlayerMetaOptions {
  playerName: string
  team?: string
  position?: string
  profileImage?: string
}

/**
 * Custom hook for managing meta tags for SEO and social media
 */
export function useMetaTags(options: MetaTagsOptions) {
  useEffect(() => {
    const { title, description, image, url, type = 'website', twitterCard = 'summary_large_image' } = options

    // Set basic meta tags
    updateMetaTag('description', description)
    
    // Open Graph tags
    updateMetaTag('og:title', title)
    updateMetaTag('og:description', description)
    updateMetaTag('og:type', type)
    updateMetaTag('og:site_name', 'FloorLive')
    
    if (url) {
      updateMetaTag('og:url', url)
    }
    
    if (image) {
      updateMetaTag('og:image', image)
      updateMetaTag('og:image:alt', title)
    }
    
    // Twitter Card tags
    updateMetaTag('twitter:card', twitterCard)
    updateMetaTag('twitter:title', title)
    updateMetaTag('twitter:description', description)
    
    if (image) {
      updateMetaTag('twitter:image', image)
    }

    // Cleanup function to remove custom meta tags when component unmounts
    return () => {
      removeMetaTag('og:title')
      removeMetaTag('og:description')
      removeMetaTag('og:type')
      removeMetaTag('og:url')
      removeMetaTag('og:image')
      removeMetaTag('og:image:alt')
      removeMetaTag('twitter:title')
      removeMetaTag('twitter:description')
      removeMetaTag('twitter:image')
    }
  }, [options])
}

/**
 * Utility function to update or create meta tags
 */
function updateMetaTag(property: string, content: string) {
  const isProperty = property.startsWith('og:') || property.startsWith('twitter:')
  const attribute = isProperty ? 'property' : 'name'
  
  let metaTag = document.querySelector(`meta[${attribute}="${property}"]`)
  
  if (!metaTag) {
    metaTag = document.createElement('meta')
    metaTag.setAttribute(attribute, property)
    document.head.appendChild(metaTag)
  }
  
  metaTag.setAttribute('content', content)
}

/**
 * Utility function to remove meta tags
 */
function removeMetaTag(property: string) {
  const isProperty = property.startsWith('og:') || property.startsWith('twitter:')
  const attribute = isProperty ? 'property' : 'name'
  
  const metaTag = document.querySelector(`meta[${attribute}="${property}"]`)
  if (metaTag && metaTag.parentNode) {
    metaTag.parentNode.removeChild(metaTag)
  }
}

/**
 * Utility functions for generating meta tags for different page types
 */
export const generateGameMeta = (options: GameMetaOptions): MetaTagsOptions => {
  const { homeTeam, awayTeam, homeScore, awayScore, status, startTime } = options
  
  let title = `${homeTeam} - ${awayTeam}`
  let description = `Follow the Swiss Unihockey game between ${homeTeam} and ${awayTeam}`
  
  if (status === 'live' && homeScore !== null && awayScore !== null) {
    title += ` ${homeScore}-${awayScore} - Live`
    description += ` live with current score ${homeScore}-${awayScore}`
  } else if (status === 'finished' && homeScore !== null && awayScore !== null) {
    title += ` ${homeScore}-${awayScore} - Final`
    description += ` with final score ${homeScore}-${awayScore}`
  } else if (status === 'upcoming' && startTime) {
    description += ` scheduled for ${startTime}`
  }
  
  return {
    title,
    description: description + ' on FloorLive',
    type: 'website'
  }
}

export const generateTeamMeta = (options: TeamMetaOptions): MetaTagsOptions => {
  const { teamName, league } = options
  
  return {
    title: `${teamName} - Team Profile`,
    description: `View ${teamName}${league ? ` (${league})` : ''} players, statistics, and upcoming games on FloorLive`,
    type: 'website'
  }
}

export const generatePlayerMeta = (options: PlayerMetaOptions): MetaTagsOptions => {
  const { playerName, team, position } = options
  
  let description = `View statistics and game history for ${playerName}`
  if (position) description += ` (${position})`
  if (team) description += ` playing for ${team}`
  description += ' on FloorLive'
  
  return {
    title: `${playerName} - Player Profile`,
    description,
    type: 'website'
  }
}

export default useMetaTags