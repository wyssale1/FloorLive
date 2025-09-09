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
