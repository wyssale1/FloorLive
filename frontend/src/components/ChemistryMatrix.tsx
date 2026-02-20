import { useMemo, useState, useEffect } from 'react'
import { m } from 'framer-motion'
import type { MatrixEntry, SoloGoalEntry } from '../hooks/useChemistryAnalysis'
import PlayerLink from './PlayerLink'

const ROW_HEADER_W = 112
const SUMMARY_W = 44
const COL_W = 90
const H_DEFAULT = 40

// Mobile-specific (< 640px)
const ROW_HEADER_W_MOBILE = 52
const COL_W_MOBILE = 44
const SUMMARY_W_MOBILE = 36
const H_DEFAULT_MOBILE = 36

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

function truncateMobile(name: string): string {
  if (!name || name.length <= 6) return name
  return name.slice(0, 4) + '…'
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
function SkeletonOverlay({ delay }: { delay: number }) {
  return (
    <m.div
      className="absolute inset-0 bg-gray-100 pointer-events-none"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay, duration: 0.28, ease: 'easeOut' }}
    />
  )
}

export default function ChemistryMatrix({ matrix, soloGoals, splitHomeAway }: ChemistryMatrixProps) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 640
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const colW = isMobile ? COL_W_MOBILE : COL_W
  const rowHeaderW = isMobile ? ROW_HEADER_W_MOBILE : ROW_HEADER_W
  const summaryW = isMobile ? SUMMARY_W_MOBILE : SUMMARY_W
  const cellH = isMobile ? H_DEFAULT_MOBILE : H_DEFAULT

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
    <div className={`overflow-auto rounded-lg border border-gray-100 ${isMobile ? 'max-h-[390px]' : 'max-h-[560px]'}`}>
      <table className="border-collapse text-xs" style={{ minWidth: 'max-content' }}>
        <thead>
          <tr>
            {/* Top-left corner */}
            <th
              className="sticky left-0 top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-r border-gray-100 p-3"
              style={{ width: rowHeaderW, minWidth: rowHeaderW }}
            >
              {isMobile ? (
                <div className="text-[9px] font-normal leading-tight">
                  <div className="text-gray-400">G →</div>
                  <div className="text-gray-300">A ↓</div>
                </div>
              ) : (
                <div className="text-[10px] font-normal tracking-wide uppercase leading-relaxed">
                  <div className="text-gray-400">Goal →</div>
                  <div className="text-gray-300">Assist ↓</div>
                </div>
              )}
            </th>

            {/* Scorer column headers */}
            {scorers.map((scorer, colIdx) => {
              const [first, last] = splitName(scorer.displayName)
              return (
                <m.th
                  key={scorer.rawName}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: colIdx * 0.025, duration: 0.2, ease: 'easeOut' }}
                  className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-r border-gray-100 p-2 font-medium text-gray-700"
                  style={{ width: colW, minWidth: colW }}
                >
                  {isMobile ? (
                    <PlayerLink
                      playerId={scorer.playerId ?? ''}
                      playerName={scorer.displayName}
                      className="block w-full text-[10px] font-medium text-gray-700 leading-tight overflow-hidden"
                    >
                      <span className="block truncate" title={scorer.displayName}>
                        {truncateMobile(last || scorer.displayName)}
                      </span>
                    </PlayerLink>
                  ) : (
                    <PlayerLink
                      playerId={scorer.playerId ?? ''}
                      playerName={scorer.displayName}
                      className="block w-full text-xs font-medium text-gray-700 leading-tight overflow-hidden"
                    >
                      {first && <span className="block truncate">{first}</span>}
                      <span className="block truncate">{last}</span>
                    </PlayerLink>
                  )}
                </m.th>
              )
            })}

            {/* Top-right summary label */}
            <th
              className="sticky top-0 right-0 z-20 border-b border-l border-gray-200 p-2 bg-gray-50/95 backdrop-blur-sm text-center"
              style={{ width: summaryW, minWidth: summaryW }}
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
                {/* Assist row header */}
                <m.td
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: rowIdx * 0.025, duration: 0.2, ease: 'easeOut' }}
                  className="sticky left-0 z-10 bg-white/95 backdrop-blur-sm border-b border-r border-gray-100 p-2 font-medium text-gray-700 group-hover:bg-gray-50/80 align-middle"
                  style={{ width: rowHeaderW, minWidth: rowHeaderW }}
                >
                  {isMobile ? (
                    <PlayerLink
                      playerId={assister.playerId ?? ''}
                      playerName={assister.displayName}
                      className="block w-full text-[10px] font-medium text-gray-700 leading-tight overflow-hidden"
                    >
                      <span className="block truncate" title={assister.displayName}>
                        {truncateMobile(last || assister.displayName)}
                      </span>
                    </PlayerLink>
                  ) : (
                    <PlayerLink
                      playerId={assister.playerId ?? ''}
                      playerName={assister.displayName}
                      className="block w-full text-xs font-medium text-gray-700 leading-tight overflow-hidden"
                    >
                      {first && <span className="block truncate">{first}</span>}
                      <span className="block truncate">{last}</span>
                    </PlayerLink>
                  )}
                </m.td>

                {/* Data cells */}
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
                      style={{ width: colW, minWidth: colW }}
                    >
                      {isSelf ? (
                        <SoloDiagonalCell entry={soloEntry} splitHomeAway={splitHomeAway} cellH={cellH} compact={isMobile} />
                      ) : comboEntry ? (
                        <ComboCellContent entry={comboEntry} splitHomeAway={splitHomeAway} cellH={cellH} compact={isMobile} />
                      ) : (
                        <EmptyCell cellH={cellH} />
                      )}
                      <SkeletonOverlay delay={delay} />
                    </td>
                  )
                })}

                {/* Right summary: assists for this row */}
                <td
                  className={`sticky right-0 z-10 border-b border-l text-center align-middle ${summaryCell}`}
                  style={{ width: summaryW, minWidth: summaryW }}
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
              style={{ width: rowHeaderW }}
            >
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Goals</span>
            </td>

            {scorers.map((scorer) => {
              const total = columnGoals.get(scorer.rawName) ?? 0
              return (
                <td
                  key={scorer.rawName}
                  className={`sticky bottom-0 z-10 border-t border-r text-center align-middle ${summaryCell}`}
                  style={{ width: colW, height: 36 }}
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
              style={{ width: summaryW }}
            />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ─── Fixed-height cell wrapper (no animation = smooth in all browsers) ─────

interface CellWrapperProps {
  cellH: number
  children: React.ReactNode
}

function CellWrapper({ cellH, children }: CellWrapperProps) {
  return (
    <div
      className="flex flex-col items-center justify-center overflow-hidden"
      style={{ height: cellH }}
    >
      {children}
    </div>
  )
}

// ─── Empty cell ────────────────────────────────────────────────

function EmptyCell({ cellH }: { cellH: number }) {
  return (
    <CellWrapper cellH={cellH}>
      <span className="text-gray-200 select-none text-xs">·</span>
    </CellWrapper>
  )
}

// ─── Solo diagonal cell ────────────────────────────────────────

interface SoloDiagonalCellProps {
  entry: SoloGoalEntry | undefined
  splitHomeAway: boolean
  cellH: number
  compact: boolean
}

function SoloDiagonalCell({ entry, splitHomeAway, cellH, compact }: SoloDiagonalCellProps) {
  if (!entry) {
    return (
      <CellWrapper cellH={cellH}>
        <span className="text-gray-200 select-none text-xs">—</span>
      </CellWrapper>
    )
  }

  const showDetail = splitHomeAway
  const numSize = compact ? 'text-[11px]' : 'text-[12px]'
  const detailSize = compact ? 'text-[9px]' : 'text-[10px]'

  return (
    <CellWrapper cellH={cellH}>
      <span
        className={`text-gray-400 tabular-nums font-semibold leading-none ${numSize}`}
        title={`${entry.total} solo goal${entry.total !== 1 ? 's' : ''} (no assist)`}
      >
        {entry.total}
      </span>
      <m.span
        className={`tabular-nums text-gray-400 leading-none overflow-hidden block ${detailSize}`}
        animate={{
          height: showDetail ? (compact ? 11 : 13) : 0,
          opacity: showDetail ? 1 : 0,
          marginTop: showDetail ? 2 : 0,
        }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
      >
        ({entry.homeGoals}/{entry.awayGoals})
      </m.span>
    </CellWrapper>
  )
}

// ─── Combo cell content ────────────────────────────────────────

interface ComboCellContentProps {
  entry: MatrixEntry
  splitHomeAway: boolean
  cellH: number
  compact: boolean
}

function ComboCellContent({ entry, splitHomeAway, cellH, compact }: ComboCellContentProps) {
  const showDetail = splitHomeAway
  const numSize = compact ? 'text-[11px]' : 'text-[13px]'
  const detailSize = compact ? 'text-[9px]' : 'text-[10px]'

  return (
    <CellWrapper cellH={cellH}>
      <span className={`font-semibold tabular-nums leading-none ${numSize}`}>
        {entry.total}
      </span>
      <m.span
        className={`tabular-nums text-gray-400 leading-none overflow-hidden block ${detailSize}`}
        animate={{
          height: showDetail ? (compact ? 11 : 13) : 0,
          opacity: showDetail ? 1 : 0,
          marginTop: showDetail ? 2 : 0,
        }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
      >
        ({entry.homeGoals}/{entry.awayGoals})
      </m.span>
    </CellWrapper>
  )
}
