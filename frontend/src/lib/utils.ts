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
