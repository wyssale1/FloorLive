import { motion } from 'framer-motion'
import { FlaskConical, Play, Calendar, AlertCircle } from 'lucide-react'
import { useChemistryAnalysis } from '../hooks/useChemistryAnalysis'
import type { SoloGoalEntry } from '../hooks/useChemistryAnalysis'
import ChemistryMatrix from './ChemistryMatrix'
import { getCurrentSeasonYear } from '../lib/seasonUtils'

interface ChemistryAnalysisTabProps {
  teamId: string
}

export default function ChemistryAnalysisTab({ teamId }: ChemistryAnalysisTabProps) {
  const {
    phase,
    status,
    matrix,
    soloGoals,
    filters,
    errorMessage,
    hasRoster,
    progress,
    startAnalysis,
    setFilters,
  } = useChemistryAnalysis(teamId)

  const currentSeason = getCurrentSeasonYear()

  // ── Idle / Not started ──────────────────────────────────────
  if (phase === 'idle') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-6 sm:p-10 flex flex-col items-center text-center gap-4"
      >
        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
          <FlaskConical className="w-7 h-7 text-blue-500" />
        </div>
        <div>
          <h3 className="text-base font-medium text-gray-800 mb-1">Duo Chemistry Analysis</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Discover which assist–goal combinations have been most effective this season.
            The first run analyses all played games and stores the results permanently.
          </p>
        </div>
        <button
          onClick={startAnalysis}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Play className="w-4 h-4" />
          Start Analysis
        </button>
        <p className="text-xs text-gray-400">Season {currentSeason}/{currentSeason + 1}</p>
      </motion.div>
    )
  }

  // ── Processing / Starting ───────────────────────────────────
  if (phase === 'starting' || phase === 'processing') {
    const pct = Math.round(progress * 100)
    const processed = status?.gamesProcessed ?? 0
    const total = status?.gamesTotal ?? 0

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-6 sm:p-10 flex flex-col items-center text-center gap-5"
      >
        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
          <FlaskConical className="w-7 h-7 text-blue-400 animate-pulse" />
        </div>
        <div>
          <h3 className="text-base font-medium text-gray-800 mb-1">Analysing…</h3>
          {total > 0 ? (
            <p className="text-sm text-gray-500">
              Game {processed} of {total}
            </p>
          ) : (
            <p className="text-sm text-gray-500">Loading game list…</p>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-sm">
          <div className="flex justify-between text-xs text-gray-400 mb-1.5">
            <span>Progress</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </motion.div>
    )
  }

  // ── Error ───────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-6 sm:p-10 flex flex-col items-center text-center gap-4"
      >
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <div>
          <h3 className="text-base font-medium text-gray-800 mb-1">Analysis failed</h3>
          <p className="text-sm text-gray-500">{errorMessage ?? 'Something went wrong.'}</p>
        </div>
        <button
          onClick={startAnalysis}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          <Play className="w-4 h-4" />
          Retry
        </button>
      </motion.div>
    )
  }

  // ── Done – show matrix ──────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-3 sm:p-6 space-y-4"
    >
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-gray-500" />
          <h2 className="text-base font-medium text-gray-800">Duo Chemistry</h2>
          <span className="text-xs text-gray-400">
            {status?.gamesProcessed ?? 0} games · Season {filters.season}/{parseInt(filters.season) + 1}
          </span>
        </div>

        {/* Home/Away toggle */}
        <button
          onClick={() => setFilters({ splitHomeAway: !filters.splitHomeAway })}
          className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
            filters.splitHomeAway
              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
          aria-pressed={filters.splitHomeAway}
        >
          <span>Home / Away</span>
          <span className="inline-flex items-center gap-1">
            <span className={`rounded px-1 py-0.5 font-medium tabular-nums transition-colors ${filters.splitHomeAway ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>H</span>
            <span className={`rounded px-1 py-0.5 font-medium tabular-nums transition-colors ${filters.splitHomeAway ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-400'}`}>A</span>
          </span>
        </button>
      </div>

      {/* Date range filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <label className="text-xs text-gray-500">From</label>
        <input
          type="date"
          value={filters.from}
          min={`${filters.season}-09-01`}
          max={filters.to}
          onChange={e => setFilters({ from: e.target.value })}
          className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
        />
        <label className="text-xs text-gray-500">To</label>
        <input
          type="date"
          value={filters.to}
          min={filters.from}
          max={`${parseInt(filters.season) + 1}-08-31`}
          onChange={e => setFilters({ to: e.target.value })}
          className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
        />
      </div>

      {/* Name resolution note */}
      {!hasRoster && (
        <p className="text-xs text-gray-400 italic">
          Player names are based on match reports (abbreviated format). Full profiles are only
          linkable for NLA/NLB teams.
        </p>
      )}

      {/* Matrix */}
      <ChemistryMatrix matrix={matrix} soloGoals={soloGoals} splitHomeAway={filters.splitHomeAway} />
    </motion.div>
  )
}
