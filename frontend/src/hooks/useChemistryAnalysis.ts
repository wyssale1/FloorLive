import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient } from '../lib/apiClient'
import type { ChemistryStatusResponse, ChemistryMatrixResponse, MatrixEntry, SoloGoalEntry } from '../lib/apiClient'
import { getCurrentSeasonYear } from '../lib/seasonUtils'

export type { MatrixEntry, SoloGoalEntry }

export type AnalysisPhase = 'idle' | 'starting' | 'processing' | 'done' | 'error'

export interface ChemistryFilters {
  season: string
  from: string   // ISO date "YYYY-MM-DD"
  to: string     // ISO date "YYYY-MM-DD"
  splitHomeAway: boolean
}

export interface UseChemistryAnalysisResult {
  // State
  phase: AnalysisPhase
  status: ChemistryStatusResponse | null
  matrix: MatrixEntry[]
  soloGoals: SoloGoalEntry[]
  filters: ChemistryFilters
  errorMessage: string | null
  hasRoster: boolean

  // Computed progress (0–1)
  progress: number

  // Actions
  startAnalysis: () => Promise<void>
  setFilters: (partial: Partial<ChemistryFilters>) => void
}

const POLL_INTERVAL_MS = 2000

function getSeasonDateRange(season: string): { from: string; to: string } {
  const year = parseInt(season)
  return {
    from: `${year}-09-01`,
    to: `${year + 1}-08-31`,
  }
}

export function useChemistryAnalysis(teamId: string): UseChemistryAnalysisResult {
  const season = getCurrentSeasonYear().toString()
  const { from: defaultFrom, to: defaultTo } = getSeasonDateRange(season)

  const [phase, setPhase] = useState<AnalysisPhase>('idle')
  const [status, setStatus] = useState<ChemistryStatusResponse | null>(null)
  const [matrix, setMatrix] = useState<MatrixEntry[]>([])
  const [soloGoals, setSoloGoals] = useState<SoloGoalEntry[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<ChemistryFilters>({
    season,
    from: defaultFrom,
    to: defaultTo,
    splitHomeAway: false,
  })

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    // On mount: check if analysis already exists and load it directly
    ;(async () => {
      try {
        const data = await apiClient.getChemistryStatus(teamId, season)
        if (!isMountedRef.current) return
        if (data.status === 'done') {
          setStatus(data)
          setPhase('done')
          const matrixData = await apiClient.getChemistryMatrix(teamId, season, defaultFrom, defaultTo)
          if (!isMountedRef.current) return
          setMatrix(matrixData.matrix || [])
          setSoloGoals(matrixData.soloGoals || [])
        } else if (data.status === 'processing') {
          setStatus(data)
          setPhase('processing')
          pollTimerRef.current = setTimeout(pollStatus, POLL_INTERVAL_MS)
        }
        // 'not_started' or 'error' → stay on idle / let user click Start
      } catch {
        // status endpoint not reachable → stay on idle
      }
    })()

    return () => {
      isMountedRef.current = false
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (phase === 'done') {
      loadMatrix()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.from, filters.to, filters.season])

  const loadMatrix = useCallback(async () => {
    try {
      const data: ChemistryMatrixResponse = await apiClient.getChemistryMatrix(
        teamId,
        filters.season,
        filters.from,
        filters.to
      )
      if (!isMountedRef.current) return
      setMatrix(data.matrix || [])
      setSoloGoals(data.soloGoals || [])
    } catch (err) {
      console.error('[useChemistryAnalysis] Failed to load matrix:', err)
    }
  }, [teamId, filters.season, filters.from, filters.to])

  const pollStatus = useCallback(async () => {
    if (!isMountedRef.current) return
    try {
      const data = await apiClient.getChemistryStatus(teamId, filters.season)
      if (!isMountedRef.current) return
      setStatus(data)
      if (data.status === 'done') {
        setPhase('done')
        await loadMatrix()
      } else if (data.status === 'error') {
        setPhase('error')
        setErrorMessage(data.errorMessage ?? 'Analysis failed')
      } else {
        pollTimerRef.current = setTimeout(pollStatus, POLL_INTERVAL_MS)
      }
    } catch (err) {
      if (!isMountedRef.current) return
      setPhase('error')
      setErrorMessage('Failed to fetch analysis status')
    }
  }, [teamId, filters.season, loadMatrix])

  const startAnalysis = useCallback(async () => {
    if (phase === 'processing' || phase === 'starting') return
    setPhase('starting')
    setErrorMessage(null)
    try {
      const data = await apiClient.triggerChemistryAnalysis(teamId, filters.season)
      if (!isMountedRef.current) return
      setStatus(data)
      if (data.status === 'done') {
        setPhase('done')
        await loadMatrix()
      } else if (data.status === 'error') {
        setPhase('error')
        setErrorMessage(data.errorMessage ?? 'Analysis failed')
      } else {
        setPhase('processing')
        pollTimerRef.current = setTimeout(pollStatus, POLL_INTERVAL_MS)
      }
    } catch (err) {
      if (!isMountedRef.current) return
      setPhase('error')
      setErrorMessage('Failed to start analysis')
    }
  }, [phase, teamId, filters.season, loadMatrix, pollStatus])

  const setFilters = useCallback((partial: Partial<ChemistryFilters>) => {
    setFiltersState(prev => ({ ...prev, ...partial }))
  }, [])

  const progress =
    status && status.gamesTotal > 0
      ? Math.min(status.gamesProcessed / status.gamesTotal, 1)
      : 0

  return {
    phase,
    status,
    matrix,
    soloGoals,
    filters,
    errorMessage,
    hasRoster: status?.hasRoster ?? false,
    progress,
    startAnalysis,
    setFilters,
  }
}
