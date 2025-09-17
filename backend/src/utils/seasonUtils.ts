/**
 * Season calculation utilities for Swiss Unihockey
 * New seasons start on September 1st each year
 */

/**
 * Calculate the season year based on a given date
 * @param date - The date to calculate the season for (string or Date)
 * @returns The season year (e.g., 2024 for season 2024/25)
 */
export function calculateSeasonYear(date: string | Date): number {
  const gameDate = typeof date === 'string' ? new Date(date) : date

  // Get the year and month from the game date
  const year = gameDate.getFullYear()
  const month = gameDate.getMonth() + 1 // getMonth() returns 0-11

  // If the game is in September (9) or later, it belongs to the new season starting that year
  // If the game is before September (1-8), it belongs to the season that started the previous year
  if (month >= 9) {
    return year
  } else {
    return year - 1
  }
}

/**
 * Get the current season year based on today's date
 * @returns The current season year
 */
export function getCurrentSeasonYear(): number {
  return calculateSeasonYear(new Date())
}