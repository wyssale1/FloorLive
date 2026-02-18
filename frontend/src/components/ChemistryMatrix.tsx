import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { MatrixEntry, SoloGoalEntry } from '../hooks/useChemistryAnalysis'
import PlayerLink from './PlayerLink'

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

function heatClass(value: number, max: number): string {
  if (value === 0 || max === 0) return ''
  const ratio = value / max
  if (ratio >= 0.75) return 'bg-blue-200 text-blue-900'
  if (ratio >= 0.5) return 'bg-blue-100 text-blue-800'
  if (ratio >= 0.25) return 'bg-blue-50 text-blue-700'
  return 'bg-slate-50 text-slate-600'
}

export default function ChemistryMatrix({ matrix, soloGoals, splitHomeAway }: ChemistryMatrixProps) {
  const { scorers, assisters, comboLookup, soloLookup, maxComboValue, columnGoals, rowAssists } = useMemo(() => {
    const playerMap = new Map<string, PlayerInfo>()
    const scorerTotals = new Map<string, number>()
    const assisterTotals = new Map<string, number>()

    // ── Combo goals ──
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

    // ── Solo goals ──
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

    // ── Summary totals ─────────────────────────────────────────
    // Column totals: total goals per scorer (combo-assisted + solo)
    const columnGoals = new Map<string, number>()
    for (const scorer of scorers) {
      const comboGoals = matrix
        .filter(e => e.scorerRawName === scorer.rawName)
        .reduce((sum, e) => sum + e.total, 0)
      const solo = soloLookup.get(scorer.rawName)?.total ?? 0
      columnGoals.set(scorer.rawName, comboGoals + solo)
    }

    // Row totals: total assists per assister (combo only – solo has no assist)
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
            {/* Top-left corner */}
            <th className="sticky left-0 top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-r border-gray-100 p-3 min-w-[140px]">
              <div className="text-left text-gray-400 text-[10px] font-normal tracking-wide uppercase">
                Assist ↓ &nbsp; Goal →
              </div>
            </th>

            {/* Scorer column headers */}
            {scorers.map((scorer, colIdx) => (
              <motion.th
                key={scorer.rawName}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: colIdx * 0.03, duration: 0.25 }}
                className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-r border-gray-100 p-2 font-medium text-gray-700 whitespace-nowrap min-w-[90px]"
              >
                <PlayerLink
                  playerId={scorer.playerId ?? ''}
                  playerName={scorer.displayName}
                  className="text-xs font-medium text-gray-700"
                />
              </motion.th>
            ))}

            {/* Top-right summary label */}
            <th className="sticky top-0 right-0 z-20 border-b border-l border-gray-200 p-2 min-w-[52px] bg-gray-50/95 backdrop-blur-sm">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Ast</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {assisters.map((assister, rowIdx) => {
            const assistTotal = rowAssists.get(assister.rawName) ?? 0

            return (
              <tr key={assister.rawName} className="group">
                {/* Assist row header – sticky left */}
                <motion.td
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: rowIdx * 0.03, duration: 0.25 }}
                  className="sticky left-0 z-10 bg-white/95 backdrop-blur-sm border-b border-r border-gray-100 p-2 font-medium text-gray-700 whitespace-nowrap group-hover:bg-gray-50/80"
                >
                  <PlayerLink
                    playerId={assister.playerId ?? ''}
                    playerName={assister.displayName}
                    className="text-xs font-medium text-gray-700"
                  />
                </motion.td>

                {/* Data cells */}
                {scorers.map((scorer, colIdx) => {
                  const isSelf = assister.rawName === scorer.rawName
                  const comboEntry = isSelf ? undefined : comboLookup.get(`${assister.rawName}|${scorer.rawName}`)
                  const soloEntry = isSelf ? soloLookup.get(scorer.rawName) : undefined

                  return (
                    <motion.td
                      key={scorer.rawName}
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (rowIdx + colIdx) * 0.025, duration: 0.2, ease: 'easeOut' }}
                      className={[
                        'border-b border-r border-gray-100 text-center align-middle p-0 transition-colors',
                        isSelf
                          ? soloEntry ? 'bg-gray-50/80' : 'bg-gray-50'
                          : comboEntry ? heatClass(comboEntry.total, maxComboValue) : '',
                      ].join(' ')}
                      style={{ minWidth: 90, height: splitHomeAway ? 56 : 40 }}
                    >
                      {isSelf ? (
                        <SoloDiagonalCell entry={soloEntry} splitHomeAway={splitHomeAway} />
                      ) : comboEntry ? (
                        <ComboCellContent entry={comboEntry} splitHomeAway={splitHomeAway} />
                      ) : (
                        <span className="text-gray-200 select-none text-xs">·</span>
                      )}
                    </motion.td>
                  )
                })}

                {/* Right summary: assists for this row */}
                <td
                  className={`sticky right-0 z-10 border-b border-l text-center align-middle ${summaryCell}`}
                  style={{ minWidth: 52, height: splitHomeAway ? 56 : 40 }}
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
            {/* Bottom-left label */}
            <td className={`sticky left-0 bottom-0 z-20 border-t border-r p-2 ${summaryCell}`}>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Goals</span>
            </td>

            {/* Column goal totals */}
            {scorers.map((scorer, colIdx) => {
              const total = columnGoals.get(scorer.rawName) ?? 0
              return (
                <motion.td
                  key={scorer.rawName}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: colIdx * 0.02, duration: 0.2 }}
                  className={`sticky bottom-0 z-10 border-t border-r text-center align-middle ${summaryCell}`}
                  style={{ minWidth: 90, height: 36 }}
                >
                  {total > 0 ? (
                    <span className={summaryText}>{total}</span>
                  ) : (
                    <span className="text-gray-300 text-xs">·</span>
                  )}
                </motion.td>
              )
            })}

            {/* Bottom-right corner – intentionally empty */}
            <td className={`sticky right-0 bottom-0 z-20 border-t border-l ${summaryCell}`} />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ─── Solo diagonal cell ───────────────────────────────────────

interface SoloDiagonalCellProps {
  entry: SoloGoalEntry | undefined
  splitHomeAway: boolean
}

function SoloDiagonalCell({ entry, splitHomeAway }: SoloDiagonalCellProps) {
  if (!entry) {
    return <span className="text-gray-200 select-none text-xs">—</span>
  }

  if (!splitHomeAway) {
    return (
      <span
        className="text-gray-400 tabular-nums text-[11px] leading-none"
        title={`${entry.total} solo goal${entry.total !== 1 ? 's' : ''} (no assist)`}
      >
        {entry.total}
      </span>
    )
  }

  return (
    <div className="flex flex-col items-center gap-0.5 py-1 px-2" title="Solo goals (no assist)">
      <span className="text-gray-400 tabular-nums text-[11px] leading-none">{entry.total}</span>
      <div className="flex items-center gap-1 text-[10px] leading-none">
        {entry.homeGoals > 0 && (
          <span className="rounded px-1 py-0.5 bg-green-50 text-green-500 tabular-nums">
            {entry.homeGoals}H
          </span>
        )}
        {entry.awayGoals > 0 && (
          <span className="rounded px-1 py-0.5 bg-orange-50 text-orange-400 tabular-nums">
            {entry.awayGoals}A
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Combo cell content ───────────────────────────────────────

interface ComboCellContentProps {
  entry: MatrixEntry
  splitHomeAway: boolean
}

function ComboCellContent({ entry, splitHomeAway }: ComboCellContentProps) {
  if (!splitHomeAway) {
    return <span className="font-semibold tabular-nums leading-none">{entry.total}</span>
  }

  return (
    <div className="flex flex-col items-center gap-0.5 py-1 px-2">
      <span className="font-semibold tabular-nums text-[11px] leading-none">{entry.total}</span>
      <div className="flex items-center gap-1 text-[10px] leading-none">
        {entry.homeGoals > 0 && (
          <span className="rounded px-1 py-0.5 bg-green-100 text-green-700 font-medium tabular-nums">
            {entry.homeGoals}H
          </span>
        )}
        {entry.awayGoals > 0 && (
          <span className="rounded px-1 py-0.5 bg-orange-100 text-orange-700 font-medium tabular-nums">
            {entry.awayGoals}A
          </span>
        )}
      </div>
    </div>
  )
}
