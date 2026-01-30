import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts league identifier from league object
 * Prioritizes id over name for consistency
 * @param league League object with optional id and name properties
 * @returns League identifier string or null if not available
 */
export function extractLeagueId(league?: { id?: string; name?: string } | null): string | null {
  if (!league) return null

  // Prioritize id over name, but use name as fallback
  const leagueId = league.id || league.name

  // Validate the extracted value
  if (!leagueId || leagueId.trim() === '' || leagueId === '0' || leagueId === 'null') {
    return null
  }

  return leagueId.trim()
}

/**
 * Formats a date string to Swiss date format (DD.MM.YYYY)
 * @param dateString ISO date string (YYYY-MM-DD) or any valid date string
 * @returns Formatted date in Swiss format (DD.MM.YYYY)
 */
export function formatSwissDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return dateString // fallback to original if parsing fails
  }
}

/**
 * Maps league names from games/teams to correct API parameters for rankings
 * This is needed because the league names in game/team objects differ from
 * the values required by the rankings API
 */
export function mapLeagueForRankings(league?: {
  id?: string
  name?: string
  gameClass?: number | string
} | null): {
  league: string
  leagueName: string
} | null {
  if (!league || !league.name) return null

  const leagueName = league.name.trim()
  const gameClass = league.gameClass?.toString()

  // NLA (L-UPL) - Men and Women
  if (leagueName.includes('L-UPL') || leagueName.includes('NLA')) {
    return {
      league: '24',
      leagueName: 'L-UPL'
    }
  }

  // NLB - Men and Women 
  if (leagueName.includes('NLB')) {
    // Determine gender based on gameClass
    if (gameClass === '11') {
      // Men
      return {
        league: '2',
        leagueName: 'H'
      }
    } else if (gameClass === '21') {
      // Women
      return {
        league: '2',
        leagueName: 'D'
      }
    }
    // Fallback for NLB without clear gender
    return {
      league: '2',
      leagueName: 'H' // Default to men
    }
  }

  // For other leagues, use league ID and name as-is
  const leagueId = league.id || league.name
  if (!leagueId || leagueId.trim() === '' || leagueId === '0' || leagueId === 'null') {
    return null
  }

  return {
    league: leagueId.trim(),
    leagueName: leagueName
  }
}
