import { useState, useEffect, useCallback, useRef } from 'react'
import { determineGameLiveStatus, shouldPollGameForUpdates, type LiveGameStatus } from '../lib/liveGameUtils'
import { apiClient, type GameEvent } from '../lib/apiClient'

interface UseLiveGameOptions {
  gameId: string
  initialGame?: any
  initialEvents?: GameEvent[]
  pollInterval?: number // in milliseconds
  enabled?: boolean
}

interface UseLiveGameReturn {
  liveStatus: LiveGameStatus
  isPolling: boolean
  lastUpdated: Date | null
  error: Error | null
  refetch: () => Promise<void>
  startPolling: () => void
  stopPolling: () => void
}

export function useLiveGame({
  gameId,
  initialGame,
  initialEvents = [],
  pollInterval = 30000, // 30 seconds
  enabled = true
}: UseLiveGameOptions): UseLiveGameReturn {
  const [liveStatus, setLiveStatus] = useState<LiveGameStatus>(() => 
    determineGameLiveStatus(initialGame, initialEvents)
  )
  const [isPolling, setIsPolling] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const gameRef = useRef(initialGame)
  const eventsRef = useRef<GameEvent[]>(initialEvents)

  // Update refs when props change
  useEffect(() => {
    gameRef.current = initialGame
  }, [initialGame])

  useEffect(() => {
    eventsRef.current = initialEvents
  }, [initialEvents])

  const fetchLatestData = useCallback(async (): Promise<{ game: any, events: GameEvent[] }> => {
    try {
      // Fetch both game details and events in parallel
      const [gameData, eventsData] = await Promise.all([
        apiClient.getGameDetails(gameId),
        apiClient.getGameEvents(gameId)
      ])

      return {
        game: gameData ? apiClient.adaptGameForFrontend(gameData) : gameRef.current,
        events: eventsData || []
      }
    } catch (err) {
      console.error('Error fetching live game data:', err)
      throw err
    }
  }, [gameId])

  const updateLiveStatus = useCallback(async () => {
    try {
      setError(null)
      
      // Use current refs if no fresh data fetch is needed for initial status check
      const currentGame = gameRef.current
      const currentEvents = eventsRef.current || []
      
      // Check if we should fetch fresh data (if game might be live)
      const currentStatus = determineGameLiveStatus(currentGame, currentEvents)
      
      if (shouldPollGameForUpdates(currentStatus)) {
        // Fetch fresh data for live/potentially live games
        const { game: freshGame, events: freshEvents } = await fetchLatestData()
        gameRef.current = freshGame
        eventsRef.current = freshEvents
        
        const freshStatus = determineGameLiveStatus(freshGame, freshEvents)
        setLiveStatus(freshStatus)
      } else {
        // Use cached data for non-live games
        setLiveStatus(currentStatus)
      }
      
      setLastUpdated(new Date())
    } catch (err) {
      setError(err as Error)
    }
  }, [fetchLatestData])

  const refetch = useCallback(async () => {
    await updateLiveStatus()
  }, [updateLiveStatus])

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current || !enabled) return
    
    setIsPolling(true)
    
    // Initial update
    updateLiveStatus()
    
    // Set up polling
    pollIntervalRef.current = setInterval(async () => {
      await updateLiveStatus()
      
      // Check if we should continue polling
      const currentStatus = liveStatus
      if (!shouldPollGameForUpdates(currentStatus)) {
        stopPolling()
      }
    }, pollInterval)
  }, [updateLiveStatus, pollInterval, enabled, liveStatus])

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    setIsPolling(false)
  }, [])

  // Auto-start polling for potentially live games
  useEffect(() => {
    if (!enabled) return

    const currentStatus = determineGameLiveStatus(gameRef.current, eventsRef.current)
    
    if (shouldPollGameForUpdates(currentStatus)) {
      startPolling()
    } else {
      // Still update status once for non-live games
      updateLiveStatus()
    }

    return () => {
      stopPolling()
    }
  }, [enabled, gameId]) // Only depend on enabled and gameId, not the callback functions

  // Update status when initial data changes
  useEffect(() => {
    if (initialGame || initialEvents.length > 0) {
      const newStatus = determineGameLiveStatus(initialGame, initialEvents)
      setLiveStatus(newStatus)
    }
  }, [initialGame, initialEvents])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  return {
    liveStatus,
    isPolling,
    lastUpdated,
    error,
    refetch,
    startPolling,
    stopPolling
  }
}