import type { GameEvent } from '../types/domain'

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
  
  // User's logic: if game is in the 3-hour window, it could be live
  if (timeStatus.shouldBeLive) {
    console.log(`Game is in 3-hour window, checking for existing meaningful scores...`)
    
    // Only consider it finished if we have meaningful scores (not 0-0)
    const hasMeaningfulScores = (status.homeScore !== null && status.awayScore !== null && 
                                (status.homeScore > 0 || status.awayScore > 0))
    
    console.log(`Has meaningful scores: ${hasMeaningfulScores} (${status.homeScore}-${status.awayScore})`)
    
    if (hasMeaningfulScores) {
      // Game has real scores and is in time window = finished
      status.status = 'finished'
      status.isLive = false
      console.log('Game marked as finished due to meaningful scores')
    } else {
      // No meaningful scores or 0-0 = potentially live
      status.status = 'live'
      status.isLive = true
      console.log('Game marked as live - fetching events for scores')
      
      // Try to get scores from events for live games
      const latestScore = parseLatestScoreFromEvents(events)
      console.log(`Events for live game:`, events.length, 'events')
      console.log(`Latest score from events:`, latestScore)
      if (latestScore) {
        status.homeScore = latestScore.home
        status.awayScore = latestScore.away
        console.log(`Updated scores from events: ${latestScore.home}-${latestScore.away}`)
      }
      
      // Check if game has started/ended based on events for additional info
      const gameEvents = analyzeGameEvents(events)
      status.currentPeriod = gameEvents.currentPeriod
      status.lastEventTime = gameEvents.lastEventTime
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
  if (!events || events.length === 0) {
    console.log('No events provided to parseLatestScoreFromEvents')
    return null
  }

  console.log(`Parsing ${events.length} events for scores`)
  
  // Look for goal events with score information
  const goalEvents = events.filter(event => 
    event.eventType === 'goal' && 
    event.description?.includes(':')
  )
  
  console.log(`Found ${goalEvents.length} goal events with scores`)
  goalEvents.forEach((event, i) => {
    console.log(`Goal event ${i}:`, event.description)
  })

  if (goalEvents.length === 0) return null

  // Get the most recent goal event (events are in reverse chronological order from API)
  const latestGoal = goalEvents[0]
  console.log('Latest goal event:', latestGoal.description)
  
  // Parse score from description like "Torschütze 3:1"
  const scoreMatch = latestGoal.description?.match(/(\d+):(\d+)/)
  console.log('Score match result:', scoreMatch)
  if (!scoreMatch) return null

  const result = {
    home: parseInt(scoreMatch[1]),
    away: parseInt(scoreMatch[2])
  }
  console.log('Parsed score:', result)
  return result
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
    ['period_start', 'period_end', 'game_start', 'game_end'].includes(event.eventType || '')
  )

  // Check for game start
  analysis.hasGameStarted = flowEvents.some(event => 
    event.eventType === 'game_start' || 
    event.description?.includes('Spielbeginn') ||
    event.description?.includes('Beginn')
  )

  // Check for game end  
  analysis.hasGameEnded = flowEvents.some(event => 
    event.eventType === 'game_end' || 
    event.description?.includes('Spielende')
  )

  // Determine current period from most recent period start
  const periodStarts = flowEvents.filter(event => 
    event.eventType === 'period_start' || 
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
    event.eventType === 'period_end' || 
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

    // Debug logging
    console.log(`Time check for game: ${game.homeTeam?.name || 'Unknown'} vs ${game.awayTeam?.name || 'Unknown'}`)
    console.log(`Game time: ${gameDateTime.toLocaleString()}`)
    console.log(`Current time: ${currentTime.toLocaleString()}`) 
    console.log(`Minutes diff: ${minutesDiff}`)

    // User's logic: game time to +3 hours (180 minutes) = potential live game
    // If current time is between game start and +3 hours, it could be live
    const shouldBeLive = minutesDiff >= 0 && minutesDiff <= 180
    
    console.log(`Should be live: ${shouldBeLive}`)

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