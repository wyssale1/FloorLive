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
 * Determines if a game is currently live based on timing and events
 */
export function determineGameLiveStatus(
  game: any,
  events: GameEvent[] = [],
  currentTime: Date = new Date()
): LiveGameStatus {
  // Initialize default status
  const status: LiveGameStatus = {
    isLive: false,
    homeScore: game?.home_score || null,
    awayScore: game?.away_score || null,
    status: 'pre-game'
  }

  // Parse latest scores from events
  const latestScore = parseLatestScoreFromEvents(events)
  if (latestScore) {
    status.homeScore = latestScore.home
    status.awayScore = latestScore.away
  }

  // Check if game has started based on events
  const gameEvents = analyzeGameEvents(events)
  
  // If we have game events, determine live status
  if (gameEvents.hasGameStarted) {
    status.status = gameEvents.hasGameEnded ? 'finished' : 'live'
    status.isLive = !gameEvents.hasGameEnded
    status.currentPeriod = gameEvents.currentPeriod
    status.lastEventTime = gameEvents.lastEventTime
  } else {
    // Fallback to time-based detection
    const timeStatus = determineGameTimeStatus(game, currentTime)
    status.isLive = timeStatus.shouldBeLive
    status.status = timeStatus.status
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
 * Time-based live detection fallback
 */
export function determineGameTimeStatus(game: any, currentTime: Date) {
  if (!game?.start_time || !game?.game_date) {
    return { shouldBeLive: false, status: 'pre-game' as const }
  }

  try {
    // Handle different date formats
    let gameDateTime: Date
    
    if (game.game_date === 'heute') {
      // Today's game
      gameDateTime = new Date()
      const [hours, minutes] = game.start_time.split(':')
      gameDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    } else {
      // Parse date format (assuming DD.MM.YYYY)
      const dateParts = game.game_date.split('.')
      if (dateParts.length === 3) {
        const [day, month, year] = dateParts
        gameDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        const [hours, minutes] = game.start_time.split(':')
        gameDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      } else {
        return { shouldBeLive: false, status: 'pre-game' as const }
      }
    }

    const timeDiff = currentTime.getTime() - gameDateTime.getTime()
    const minutesDiff = timeDiff / (1000 * 60)

    // Game should be live if it started within the last 3 hours (180 minutes)
    // and hasn't been going for more than 4 hours (in case of delays/overtime)
    const shouldBeLive = minutesDiff >= -15 && minutesDiff <= 240

    let status: 'pre-game' | 'live' | 'finished'
    if (minutesDiff < -15) {
      status = 'pre-game'
    } else if (minutesDiff > 240) {
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