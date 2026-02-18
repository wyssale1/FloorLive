import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { MatrixEntry, SoloGoalEntry } from '../hooks/useChemistryAnalysis'
import PlayerLink from './PlayerLink'

const ROW_HEADER_W = 112
const SUMMARY_W = 44
const COL_W = 90
const H_DEFAULT = 40
const H_SPLIT = 56

// Maximum delay for the diagonal wave so large matrices don't feel too slow
const diagonalDelay = (row: number, col: number) =>
  Math.min((row + col) * 0.04, 0.55)

interface ChemistryMatrixProps {
  matrix: MatrixEntry[]
  soloGoals: SoloGoalEntry[]
  splitHomeAway: boolean
}

interface PlayerInfo {
  rawName: string
  displayName: string
  playerId: string | null
}

function splitName(name: string): [string, string] {
  const idx = name.lastIndexOf(' ')
  if (idx === -1) return ['', name]
  return [name.slice(0, idx), name.slice(idx + 1)]
}

function heatClass(value: number, max: number): string {
  if (value === 0 || max === 0) return ''
  const ratio = value / max
  if (ratio >= 0.75) return 'bg-blue-200 text-blue-900'
  if (ratio >= 0.5) return 'bg-blue-100 text-blue-800'
  if (ratio >= 0.25) return 'bg-blue-50 text-blue-700'
  return 'bg-slate-50 text-slate-600'
}

// ─── Skeleton overlay ──────────────────────────────────────────
// Covers a cell on mount and fades out with the given delay,
// revealing the real content underneath.
function SkeletonOverlay({ delay }: { delay: number }) {
  return (
    <motion.div
      className="absolute inset-0 bg-gray-100 pointer-events-none"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay, duration: 0.28, ease: 'easeOut' }}
    />
  )
}

export default function ChemistryMatrix({ matrix, soloGoals, splitHomeAway }: ChemistryMatrixProps) {
  const { scorers, assisters, comboLookup, soloLookup, maxComboValue, columnGoals, rowAssists } = useMemo(() => {
    const playerMap = new Map<string, PlayerInfo>()
    const scorerTotals = new Map<string, number>()
    const assisterTotals = new Map<string, number>()

    for (const entry of matrix) {
      playerMap.set(entry.scorerRawName, {
        rawName: entry.scorerRawName,
        displayName: entry.scorerDisplayName,
        playerId: entry.scorerPlayerId,
      })
      playerMap.set(entry.assistRawName, {
        rawName: entry.assistRawName,
        displayName: entry.assistDisplayName,
        playerId: entry.assistPlayerId,
      })
      scorerTotals.set(entry.scorerRawName, (scorerTotals.get(entry.scorerRawName) ?? 0) + entry.total)
      assisterTotals.set(entry.assistRawName, (assisterTotals.get(entry.assistRawName) ?? 0) + entry.total)
    }

    for (const entry of soloGoals) {
      if (!playerMap.has(entry.scorerRawName)) {
        playerMap.set(entry.scorerRawName, {
          rawName: entry.scorerRawName,
          displayName: entry.scorerDisplayName,
          playerId: entry.scorerPlayerId,
        })
      }
      scorerTotals.set(entry.scorerRawName, (scorerTotals.get(entry.scorerRawName) ?? 0) + entry.total)
      assisterTotals.set(entry.scorerRawName, (assisterTotals.get(entry.scorerRawName) ?? 0) + entry.total)
    }

    const allPlayers = [...playerMap.values()]
    const scorers = [...allPlayers].sort((a, b) => (scorerTotals.get(b.rawName) ?? 0) - (scorerTotals.get(a.rawName) ?? 0))
    const assisters = [...allPlayers].sort((a, b) => (assisterTotals.get(b.rawName) ?? 0) - (assisterTotals.get(a.rawName) ?? 0))

    const comboLookup = new Map<string, MatrixEntry>()
    for (const entry of matrix) {
      comboLookup.set(`${entry.assistRawName}|${entry.scorerRawName}`, entry)
    }

    const soloLookup = new Map<string, SoloGoalEntry>()
    for (const entry of soloGoals) {
      soloLookup.set(entry.scorerRawName, entry)
    }

    const maxComboValue = Math.max(0, ...matrix.map(e => e.total))

    const columnGoals = new Map<string, number>()
    for (const scorer of scorers) {
      const comboGoals = matrix
        .filter(e => e.scorerRawName === scorer.rawName)
        .reduce((sum, e) => sum + e.total, 0)
      const solo = soloLookup.get(scorer.rawName)?.total ?? 0
      columnGoals.set(scorer.rawName, comboGoals + solo)
    }

    const rowAssists = new Map<string, number>()
    for (const assister of assisters) {
      const total = matrix
        .filter(e => e.assistRawName === assister.rawName)
        .reduce((sum, e) => sum + e.total, 0)
      rowAssists.set(assister.rawName, total)
    }

    return { scorers, assisters, comboLookup, soloLookup, maxComboValue, columnGoals, rowAssists }
  }, [matrix, soloGoals])

  if (matrix.length === 0 && soloGoals.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        No goal data found for the selected period.
      </div>
    )
  }

  const summaryCell = 'bg-gray-50/90 backdrop-blur-sm border-gray-200'
  const summaryText = 'text-[11px] font-semibold tabular-nums text-gray-500'

  return (
    <div className="overflow-auto max-h-[560px] rounded-lg border border-gray-100">
      <table className="border-collapse text-xs" style={{ minWidth: 'max-content' }}>
        <thead>
          <tr>
            {/* Top-left corner – two-line label */}
            <th
              className="sticky left-0 top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-r border-gray-100 p-3"
              style={{ width: ROW_HEADER_W, minWidth: ROW_HEADER_W }}
            >
              <div className="text-[10px] font-normal tracking-wide uppercase leading-relaxed">
                <div className="text-gray-400">Goal →</div>
                <div className="text-gray-300">Assist ↓</div>
              </div>
            </th>

            {/* Scorer column headers */}
            {scorers.map((scorer, colIdx) => {
              const [first, last] = splitName(scorer.displayName)
              return (
                <motion.th
                  key={scorer.rawName}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: colIdx * 0.025, duration: 0.2, ease: 'easeOut' }}
                  className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-r border-gray-100 p-2 font-medium text-gray-700"
                  style={{ width: COL_W, minWidth: COL_W }}
                >
                  <PlayerLink
                    playerId={scorer.playerId ?? ''}
                    playerName={scorer.displayName}
                    className="block w-full text-xs font-medium text-gray-700 leading-tight overflow-hidden"
                  >
                    {first && <span className="block truncate">{first}</span>}
                    <span className="block truncate">{last}</span>
                  </PlayerLink>
                </motion.th>
              )
            })}

            {/* Top-right summary label */}
            <th
              className="sticky top-0 right-0 z-20 border-b border-l border-gray-200 p-2 bg-gray-50/95 backdrop-blur-sm text-center"
              style={{ width: SUMMARY_W, minWidth: SUMMARY_W }}
            >
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Ast</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {assisters.map((assister, rowIdx) => {
            const assistTotal = rowAssists.get(assister.rawName) ?? 0
            const [first, last] = splitName(assister.displayName)

            return (
              <tr key={assister.rawName} className="group">
                {/* Assist row header – sticky left, slide in from left */}
                <motion.td
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: rowIdx * 0.025, duration: 0.2, ease: 'easeOut' }}
                  className="sticky left-0 z-10 bg-white/95 backdrop-blur-sm border-b border-r border-gray-100 p-2 font-medium text-gray-700 group-hover:bg-gray-50/80 align-middle"
                  style={{ width: ROW_HEADER_W, minWidth: ROW_HEADER_W }}
                >
                  <PlayerLink
                    playerId={assister.playerId ?? ''}
                    playerName={assister.displayName}
                    className="block w-full text-xs font-medium text-gray-700 leading-tight overflow-hidden"
                  >
                    {first && <span className="block truncate">{first}</span>}
                    <span className="block truncate">{last}</span>
                  </PlayerLink>
                </motion.td>

                {/* Data cells – skeleton overlay reveals diagonally */}
                {scorers.map((scorer, colIdx) => {
                  const isSelf = assister.rawName === scorer.rawName
                  const comboEntry = isSelf ? undefined : comboLookup.get(`${assister.rawName}|${scorer.rawName}`)
                  const soloEntry = isSelf ? soloLookup.get(scorer.rawName) : undefined
                  const delay = diagonalDelay(rowIdx, colIdx)

                  return (
                    <td
                      key={scorer.rawName}
                      className={[
                        'border-b border-r border-gray-100 p-0 transition-colors relative overflow-hidden',
                        isSelf
                          ? soloEntry ? 'bg-gray-50/80' : 'bg-gray-50'
                          : comboEntry ? heatClass(comboEntry.total, maxComboValue) : '',
                      ].join(' ')}
                      style={{ width: COL_W, minWidth: COL_W }}
                    >
                      {isSelf ? (
                        <SoloDiagonalCell entry={soloEntry} splitHomeAway={splitHomeAway} />
                      ) : comboEntry ? (
                        <ComboCellContent entry={comboEntry} splitHomeAway={splitHomeAway} />
                      ) : (
                        <EmptyCell splitHomeAway={splitHomeAway} />
                      )}
                      <SkeletonOverlay delay={delay} />
                    </td>
                  )
                })}

                {/* Right summary: assists for this row */}
                <td
                  className={`sticky right-0 z-10 border-b border-l text-center align-middle ${summaryCell}`}
                  style={{ width: SUMMARY_W, minWidth: SUMMARY_W }}
                >
                  {assistTotal > 0 ? (
                    <span className={summaryText}>{assistTotal}</span>
                  ) : (
                    <span className="text-gray-300 text-xs">·</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>

        {/* Footer row – goals per scorer */}
        <tfoot>
          <tr>
            <td
              className={`sticky left-0 bottom-0 z-20 border-t border-r p-2 ${summaryCell}`}
              style={{ width: ROW_HEADER_W }}
            >
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Goals</span>
            </td>

            {scorers.map((scorer) => {
              const total = columnGoals.get(scorer.rawName) ?? 0
              return (
                <td
                  key={scorer.rawName}
                  className={`sticky bottom-0 z-10 border-t border-r text-center align-middle ${summaryCell}`}
                  style={{ width: COL_W, height: 36 }}
                >
                  {total > 0 ? (
                    <span className={summaryText}>{total}</span>
                  ) : (
                    <span className="text-gray-300 text-xs">·</span>
                  )}
                </td>
              )
            })}

            <td
              className={`sticky right-0 bottom-0 z-20 border-t border-l ${summaryCell}`}
              style={{ width: SUMMARY_W }}
            />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ─── Shared cell height wrapper ────────────────────────────────

interface CellWrapperProps {
  splitHomeAway: boolean
  children: React.ReactNode
}

function CellWrapper({ splitHomeAway, children }: CellWrapperProps) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center"
      animate={{ height: splitHomeAway ? H_SPLIT : H_DEFAULT }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

// ─── H/A badges row (always mounted, animates in/out) ──────────

interface HABadgesProps {
  homeGoals: number
  awayGoals: number
  splitHomeAway: boolean
  solo?: boolean
}

function HABadges({ homeGoals, awayGoals, splitHomeAway, solo }: HABadgesProps) {
  return (
    <motion.div
      className="flex items-center gap-1 text-[10px] leading-none overflow-hidden"
      animate={{
        opacity: splitHomeAway ? 1 : 0,
        height: splitHomeAway ? 18 : 0,
        marginTop: splitHomeAway ? 5 : 0,
      }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
    >
      {homeGoals > 0 && (
        <span className={`rounded px-1 py-0.5 tabular-nums font-medium ${
          solo ? 'bg-green-50 text-green-500' : 'bg-green-100 text-green-700'
        }`}>
          {homeGoals}H
        </span>
      )}
      {awayGoals > 0 && (
        <span className={`rounded px-1 py-0.5 tabular-nums font-medium ${
          solo ? 'bg-orange-50 text-orange-400' : 'bg-orange-100 text-orange-700'
        }`}>
          {awayGoals}A
        </span>
      )}
    </motion.div>
  )
}

// ─── Empty cell ────────────────────────────────────────────────

function EmptyCell({ splitHomeAway }: { splitHomeAway: boolean }) {
  return (
    <CellWrapper splitHomeAway={splitHomeAway}>
      <span className="text-gray-200 select-none text-xs">·</span>
    </CellWrapper>
  )
}

// ─── Solo diagonal cell ────────────────────────────────────────

interface SoloDiagonalCellProps {
  entry: SoloGoalEntry | undefined
  splitHomeAway: boolean
}

function SoloDiagonalCell({ entry, splitHomeAway }: SoloDiagonalCellProps) {
  if (!entry) {
    return (
      <CellWrapper splitHomeAway={splitHomeAway}>
        <span className="text-gray-200 select-none text-xs">—</span>
      </CellWrapper>
    )
  }

  return (
    <CellWrapper splitHomeAway={splitHomeAway}>
      <span
        className="text-gray-400 tabular-nums text-[12px] font-semibold leading-none"
        title={`${entry.total} solo goal${entry.total !== 1 ? 's' : ''} (no assist)`}
      >
        {entry.total}
      </span>
      <HABadges
        homeGoals={entry.homeGoals}
        awayGoals={entry.awayGoals}
        splitHomeAway={splitHomeAway}
        solo
      />
    </CellWrapper>
  )
}

// ─── Combo cell content ────────────────────────────────────────

interface ComboCellContentProps {
  entry: MatrixEntry
  splitHomeAway: boolean
}

function ComboCellContent({ entry, splitHomeAway }: ComboCellContentProps) {
  return (
    <CellWrapper splitHomeAway={splitHomeAway}>
      <span className="font-semibold tabular-nums text-[13px] leading-none">{entry.total}</span>
      <HABadges
        homeGoals={entry.homeGoals}
        awayGoals={entry.awayGoals}
        splitHomeAway={splitHomeAway}
      />
    </CellWrapper>
  )
}
