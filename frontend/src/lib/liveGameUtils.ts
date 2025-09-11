import type { GameEvent } from './apiClient'

export interface LiveGameStatus {
  isLive: boolean
  currentPeriod?: string
  timeInPeriod?: string
  homeScore: number | null
  awayScore: number | null
  lastEventTime?: string
  status: 'pre-game' | 'live' | 'intermission' | 'finished'
}

/**
 * Determines if a game is currently live based on user's logic:
 * 1. Check time range (game time to +3 hours)
 * 2. If we already have scores AND in time range = finished game, use existing scores
 * 3. If no scores BUT in time range = potentially live, use event scores
 */
export function determineGameLiveStatus(
  game: any,
  events: GameEvent[] = [],
  currentTime: Date = new Date()
): LiveGameStatus {
  // Initialize default status
  const status: LiveGameStatus = {
    isLive: false,
    homeScore: game?.homeScore || game?.home_score || null,
    awayScore: game?.awayScore || game?.away_score || null,
    status: 'pre-game'
  }

  // Check time-based status first
  const timeStatus = determineGameTimeStatus(game, currentTime)
  
  // User's logic: if we already have scores AND we're in time range, game is finished
  const hasExistingScores = (status.homeScore !== null && status.awayScore !== null)
  
  if (timeStatus.shouldBeLive) {
    if (hasExistingScores) {
      // We have scores and we're in time range = game is finished, use existing scores
      status.status = 'finished'
      status.isLive = false
    } else {
      // No scores but in time range = potentially live, check events for scores
      const latestScore = parseLatestScoreFromEvents(events)
      if (latestScore) {
        status.homeScore = latestScore.home
        status.awayScore = latestScore.away
      }
      
      // Check if game has started/ended based on events
      const gameEvents = analyzeGameEvents(events)
      if (gameEvents.hasGameStarted) {
        status.status = gameEvents.hasGameEnded ? 'finished' : 'live'
        status.isLive = !gameEvents.hasGameEnded
        status.currentPeriod = gameEvents.currentPeriod
        status.lastEventTime = gameEvents.lastEventTime
      } else {
        // In time range but no clear events = assume live
        status.status = 'live'
        status.isLive = true
      }
    }
  } else {
    // Outside time range
    status.status = timeStatus.status
    status.isLive = false
  }

  return status
}

/**
 * Parses the latest score from goal events
 */
export function parseLatestScoreFromEvents(events: GameEvent[]): { home: number, away: number } | null {
  if (!events || events.length === 0) return null

  // Look for goal events with score information
  const goalEvents = events.filter(event => 
    event.event_type === 'goal' && 
    event.description?.includes(':')
  )

  if (goalEvents.length === 0) return null

  // Get the most recent goal event (events are in reverse chronological order from API)
  const latestGoal = goalEvents[0]
  
  // Parse score from description like "Torschütze 3:1"
  const scoreMatch = latestGoal.description?.match(/(\d+):(\d+)/)
  if (!scoreMatch) return null

  return {
    home: parseInt(scoreMatch[1]),
    away: parseInt(scoreMatch[2])
  }
}

/**
 * Analyzes game events to determine game state
 */
export function analyzeGameEvents(events: GameEvent[]) {
  const analysis = {
    hasGameStarted: false,
    hasGameEnded: false,
    currentPeriod: '',
    isInIntermission: false,
    lastEventTime: '',
    periods: [] as string[]
  }

  if (!events || events.length === 0) return analysis

  // Look for game flow events
  const flowEvents = events.filter(event => 
    ['period_start', 'period_end', 'game_start', 'game_end'].includes(event.event_type || '')
  )

  // Check for game start
  analysis.hasGameStarted = flowEvents.some(event => 
    event.event_type === 'game_start' || 
    event.description?.includes('Spielbeginn') ||
    event.description?.includes('Beginn')
  )

  // Check for game end  
  analysis.hasGameEnded = flowEvents.some(event => 
    event.event_type === 'game_end' || 
    event.description?.includes('Spielende')
  )

  // Determine current period from most recent period start
  const periodStarts = flowEvents.filter(event => 
    event.event_type === 'period_start' || 
    event.description?.includes('Beginn')
  )

  if (periodStarts.length > 0) {
    const latestPeriodStart = periodStarts[0] // Most recent (events are reversed)
    if (latestPeriodStart.description?.includes('1. Drittel')) {
      analysis.currentPeriod = '1st Period'
    } else if (latestPeriodStart.description?.includes('2. Drittel')) {
      analysis.currentPeriod = '2nd Period'  
    } else if (latestPeriodStart.description?.includes('3. Drittel')) {
      analysis.currentPeriod = '3rd Period'
    } else if (latestPeriodStart.description?.includes('Verlängerung')) {
      analysis.currentPeriod = 'Overtime'
    }
  }

  // Check if in intermission (period ended but game not ended)
  const recentPeriodEnd = flowEvents.find(event => 
    event.event_type === 'period_end' || 
    event.description?.includes('Ende')
  )
  analysis.isInIntermission = !!recentPeriodEnd && !analysis.hasGameEnded

  // Get last event time
  if (events.length > 0) {
    analysis.lastEventTime = events[0].time || ''
  }

  return analysis
}

/**
 * Time-based live detection - matches user's logic:
 * Game time to +3 hours = potential live game
 */
export function determineGameTimeStatus(game: any, currentTime: Date) {
  if (!game?.startTime || !game?.gameDate) {
    return { shouldBeLive: false, status: 'pre-game' as const }
  }

  try {
    // Handle different date formats
    let gameDateTime: Date
    
    if (game.gameDate === 'heute') {
      // Today's game
      gameDateTime = new Date()
      const [hours, minutes] = game.startTime.split(':')
      gameDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    } else {
      // Parse date format (assuming DD.MM.YYYY)
      const dateParts = game.gameDate.split('.')
      if (dateParts.length === 3) {
        const [day, month, year] = dateParts
        gameDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        const [hours, minutes] = game.startTime.split(':')
        gameDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      } else {
        return { shouldBeLive: false, status: 'pre-game' as const }
      }
    }

    const timeDiff = currentTime.getTime() - gameDateTime.getTime()
    const minutesDiff = timeDiff / (1000 * 60)

    // User's logic: game time to +3 hours (180 minutes) = potential live game
    // If current time is between game start and +3 hours, it could be live
    const shouldBeLive = minutesDiff >= 0 && minutesDiff <= 180

    let status: 'pre-game' | 'live' | 'finished'
    if (minutesDiff < 0) {
      status = 'pre-game'
    } else if (minutesDiff > 180) {
      status = 'finished'  
    } else {
      status = 'live'
    }

    return { shouldBeLive, status }
  } catch (error) {
    console.error('Error parsing game time:', error)
    return { shouldBeLive: false, status: 'pre-game' as const }
  }
}

/**
 * Formats live game status for display
 */
export function formatLiveStatus(status: LiveGameStatus): string {
  if (!status.isLive) return ''
  
  if (status.currentPeriod) {
    return status.currentPeriod
  }
  
  return 'LIVE'
}

/**
 * Determines if a game should be polled for live updates
 */
export function shouldPollGameForUpdates(liveStatus: LiveGameStatus): boolean {
  return liveStatus.isLive || liveStatus.status === 'live'
}