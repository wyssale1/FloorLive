import { eq, and, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { teamAnalysisState, processedGames, goalEvents } from '../db/schema.js'
import { SwissUnihockeyApiClient } from './swissUnihockeyApi.js'
import { getCurrentSeasonYear } from '../utils/seasonUtils.js'

const apiClient = new SwissUnihockeyApiClient()

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface MatrixEntry {
  assistRawName: string
  assistDisplayName: string
  assistPlayerId: string | null
  scorerRawName: string
  scorerDisplayName: string
  scorerPlayerId: string | null
  total: number
  homeGoals: number
  awayGoals: number
}

export interface SoloGoalEntry {
  scorerRawName: string
  scorerDisplayName: string
  scorerPlayerId: string | null
  total: number
  homeGoals: number
  awayGoals: number
}

export interface AnalysisStatus {
  status: 'not_started' | 'processing' | 'done' | 'error'
  gamesTotal: number
  gamesProcessed: number
  errorMessage?: string
  hasRoster: boolean
}

// A resolved player entry built from the roster
interface RosterEntry {
  playerId: string          // real API ID ('' if not available)
  fullName: string          // "Alexander Wyss"
  abbreviatedName: string   // "A. Wyss"
  ambiguous: boolean        // true if another player has the same abbreviation
}

// ─────────────────────────────────────────────────────────────
// Name resolution helpers
// ─────────────────────────────────────────────────────────────

/**
 * Converts a full player name to the abbreviated format used in game events.
 * "Alexander Wyss"   → "A. Wyss"
 * "Jean-Pierre Meier"→ "J. Meier"
 */
function toAbbreviatedName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length < 2) return fullName.trim()
  const initial = parts[0].charAt(0).toUpperCase()
  const lastName = parts.slice(1).join(' ')
  return `${initial}. ${lastName}`
}

/**
 * Builds a lookup map from abbreviated name → RosterEntry.
 * Marks entries as ambiguous when two players share the same abbreviation.
 */
function buildRosterLookup(players: any[]): Map<string, RosterEntry> {
  const lookup = new Map<string, RosterEntry>()

  for (const player of players) {
    if (!player.name?.trim()) continue
    const abbreviated = toAbbreviatedName(player.name)

    if (lookup.has(abbreviated)) {
      // Collision – mark existing entry as ambiguous
      lookup.get(abbreviated)!.ambiguous = true
    } else {
      lookup.set(abbreviated, {
        playerId: player.id || '',
        fullName: player.name,
        abbreviatedName: abbreviated,
        ambiguous: false,
      })
    }
  }

  return lookup
}

/**
 * Resolves an abbreviated event name ("A. Wyss") to the best available
 * display name and player ID, using the roster lookup if available.
 */
function resolveName(
  rawName: string,
  lookup: Map<string, RosterEntry> | null
): { displayName: string; playerId: string | null } {
  if (!lookup || lookup.size === 0) {
    return { displayName: rawName, playerId: null }
  }

  const entry = lookup.get(rawName)
  if (!entry) {
    // Player not in roster (e.g. transferred mid-season) – use raw name, no link
    return { displayName: rawName, playerId: null }
  }

  if (entry.ambiguous) {
    // Two players share this abbreviation – we cannot safely resolve
    return { displayName: rawName, playerId: null }
  }

  return {
    displayName: entry.fullName,
    playerId: entry.playerId || null,
  }
}

// ─────────────────────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────────────────────

/**
 * Converts a Swiss date string (DD.MM.YYYY) to ISO format (YYYY-MM-DD).
 * Returns null if the format is unrecognised.
 */
function swissToISO(dateStr: string): string | null {
  if (!dateStr) return null
  // Already ISO?
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  // Swiss format DD.MM.YYYY
  const match = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (!match) return null
  const [, day, month, year] = match
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// ─────────────────────────────────────────────────────────────
// DB helpers
// ─────────────────────────────────────────────────────────────

function getAnalysisState(teamId: string, season: string) {
  return db
    .select()
    .from(teamAnalysisState)
    .where(and(eq(teamAnalysisState.teamId, teamId), eq(teamAnalysisState.season, season)))
    .get()
}

function getProcessedGameIds(teamId: string, season: string): Set<string> {
  const rows = db
    .select({ gameId: processedGames.gameId })
    .from(processedGames)
    .where(and(eq(processedGames.teamId, teamId), eq(processedGames.season, season)))
    .all()
  return new Set(rows.map(r => r.gameId))
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Returns the current analysis status for a team/season from the DB.
 */
export function getStatus(teamId: string, season: string): AnalysisStatus {
  const state = getAnalysisState(teamId, season)
  if (!state) {
    return { status: 'not_started', gamesTotal: 0, gamesProcessed: 0, hasRoster: false }
  }
  return {
    status: state.status as AnalysisStatus['status'],
    gamesTotal: state.gamesTotal,
    gamesProcessed: state.gamesProcessed,
    errorMessage: state.errorMessage ?? undefined,
    hasRoster: state.hasRoster,
  }
}

/**
 * Returns the aggregated goal-combination matrix for a team,
 * optionally filtered by date range.
 * Only combinations WITH an assist are included.
 */
export function getMatrix(
  teamId: string,
  season: string,
  fromDate?: string,
  toDate?: string
): { matrix: MatrixEntry[]; soloGoals: SoloGoalEntry[] } {
  // Shared date conditions (without assist filter)
  const dateConditions: string[] = [
    `team_id = '${teamId}'`,
    `season = '${season}'`,
  ]
  if (fromDate) dateConditions.push(`game_date >= '${fromDate}'`)
  if (toDate) dateConditions.push(`game_date <= '${toDate}'`)

  const dateWhere = dateConditions.join(' AND ')

  // ── Combo goals (with assist) ──────────────────────────────
  const comboRows = db.all<{
    assist_raw_name: string
    assist_display_name: string
    assist_player_id: string | null
    scorer_raw_name: string
    scorer_display_name: string
    scorer_player_id: string | null
    total: number
    home_goals: number
    away_goals: number
  }>(sql.raw(`
    SELECT
      assist_raw_name,
      assist_display_name,
      assist_player_id,
      scorer_raw_name,
      scorer_display_name,
      scorer_player_id,
      COUNT(*) AS total,
      SUM(is_home) AS home_goals,
      SUM(1 - is_home) AS away_goals
    FROM goal_events
    WHERE ${dateWhere} AND assist_raw_name IS NOT NULL
    GROUP BY assist_raw_name, scorer_raw_name
    ORDER BY total DESC
  `))

  // ── Solo goals (no assist) – displayed on the diagonal ────
  const soloRows = db.all<{
    scorer_raw_name: string
    scorer_display_name: string
    scorer_player_id: string | null
    total: number
    home_goals: number
    away_goals: number
  }>(sql.raw(`
    SELECT
      scorer_raw_name,
      scorer_display_name,
      scorer_player_id,
      COUNT(*) AS total,
      SUM(is_home) AS home_goals,
      SUM(1 - is_home) AS away_goals
    FROM goal_events
    WHERE ${dateWhere} AND assist_raw_name IS NULL
    GROUP BY scorer_raw_name
    ORDER BY total DESC
  `))

  return {
    matrix: comboRows.map(r => ({
      assistRawName: r.assist_raw_name,
      assistDisplayName: r.assist_display_name,
      assistPlayerId: r.assist_player_id,
      scorerRawName: r.scorer_raw_name,
      scorerDisplayName: r.scorer_display_name,
      scorerPlayerId: r.scorer_player_id,
      total: Number(r.total),
      homeGoals: Number(r.home_goals),
      awayGoals: Number(r.away_goals),
    })),
    soloGoals: soloRows.map(r => ({
      scorerRawName: r.scorer_raw_name,
      scorerDisplayName: r.scorer_display_name,
      scorerPlayerId: r.scorer_player_id,
      total: Number(r.total),
      homeGoals: Number(r.home_goals),
      awayGoals: Number(r.away_goals),
    })),
  }
}

/**
 * Triggers an analysis for a team/season.
 * - If status is 'done': returns immediately (data already in DB).
 * - If status is 'processing': returns immediately (already running).
 * - Otherwise: starts analysis in the background and returns immediately.
 */
export function triggerAnalysis(teamId: string, season: string): AnalysisStatus {
  const existing = getAnalysisState(teamId, season)

  if (existing?.status === 'done' || existing?.status === 'processing') {
    return getStatus(teamId, season)
  }

  // Mark as processing immediately so UI can show a progress state
  const now = new Date().toISOString()
  if (existing) {
    db.update(teamAnalysisState)
      .set({ status: 'processing', lastUpdatedAt: now, errorMessage: null })
      .where(and(eq(teamAnalysisState.teamId, teamId), eq(teamAnalysisState.season, season)))
      .run()
  } else {
    db.insert(teamAnalysisState)
      .values({ teamId, season, status: 'processing', lastUpdatedAt: now })
      .run()
  }

  // Run analysis asynchronously (fire-and-forget)
  runAnalysis(teamId, season).catch(err => {
    console.error(`[Chemistry] Analysis failed for team ${teamId} season ${season}:`, err)
    db.update(teamAnalysisState)
      .set({
        status: 'error',
        errorMessage: err instanceof Error ? err.message : String(err),
        lastUpdatedAt: new Date().toISOString(),
      })
      .where(and(eq(teamAnalysisState.teamId, teamId), eq(teamAnalysisState.season, season)))
      .run()
  })

  return getStatus(teamId, season)
}

// ─────────────────────────────────────────────────────────────
// Core analysis logic (runs in background)
// ─────────────────────────────────────────────────────────────

async function runAnalysis(teamId: string, season: string): Promise<void> {
  console.log(`[Chemistry] Starting analysis for team ${teamId}, season ${season}`)
  const today = todayISO()

  // ── Step 1a: Load team name (needed for event filtering) ───
  let teamName: string | null = null
  try {
    const teamDetails = await apiClient.getTeamDetails(teamId)
    teamName = (teamDetails as any)?.name || null
    console.log(`[Chemistry] Team name: "${teamName}"`)
  } catch (err) {
    console.warn(`[Chemistry] Could not load team details for ${teamId}:`, err)
  }

  // ── Step 1b: Load roster (best-effort) ─────────────────────
  let rosterLookup: Map<string, RosterEntry> | null = null
  let hasRoster = false

  try {
    const players = await apiClient.getTeamPlayers(teamId)
    if (players.length > 0) {
      hasRoster = true
      rosterLookup = buildRosterLookup(players)
      console.log(`[Chemistry] Roster loaded: ${players.length} players, ${rosterLookup.size} unique abbreviations`)
    } else {
      console.log(`[Chemistry] No roster available for team ${teamId} (lower league or not published)`)
    }
  } catch (err) {
    console.warn(`[Chemistry] Could not load roster for team ${teamId}:`, err)
  }

  // Update hasRoster flag
  db.update(teamAnalysisState)
    .set({ hasRoster, lastUpdatedAt: new Date().toISOString() })
    .where(and(eq(teamAnalysisState.teamId, teamId), eq(teamAnalysisState.season, season)))
    .run()

  // ── Step 2: Load all games for this team/season ────────────
  const allGames = await apiClient.getTeamGames(teamId, season)

  // Filter to games that have already been played (date < today)
  const playedGames = allGames.filter(game => {
    const isoDate = swissToISO(game.game_date)
    return isoDate !== null && isoDate < today
  })

  console.log(`[Chemistry] Found ${playedGames.length} played games out of ${allGames.length} total`)

  // Update total count
  db.update(teamAnalysisState)
    .set({ gamesTotal: playedGames.length, lastUpdatedAt: new Date().toISOString() })
    .where(and(eq(teamAnalysisState.teamId, teamId), eq(teamAnalysisState.season, season)))
    .run()

  // ── Step 3: Find which games still need processing ─────────
  const alreadyProcessed = getProcessedGameIds(teamId, season)
  const gamesToProcess = playedGames.filter(g => !alreadyProcessed.has(g.id))

  console.log(`[Chemistry] Games to process: ${gamesToProcess.length} (${alreadyProcessed.size} already done)`)

  // ── Step 4: Process each game ──────────────────────────────
  let processed = alreadyProcessed.size

  for (const game of gamesToProcess) {
    const gameId = game.id
    const isoDate = swissToISO(game.game_date) || today

    if (!gameId) {
      console.warn(`[Chemistry] Skipping game with no ID on date ${game.game_date}`)
      processed++
      continue
    }

    try {
      const events = await apiClient.getGameEvents(gameId)

      // ── Collect goal events for this game first ──────────────
      // The Swiss API emits each assisted goal TWICE:
      //   1. "Scorer (Assister)"  – the real combo event
      //   2. "Scorer"             – a duplicate artifact (no assist listed)
      // Solo goals (genuinely unassisted) appear only once (no assist).
      //
      // Deduplication rule per scorer per game:
      //   genuine solos = max(0, noAssistCount - withAssistCount)
      //   → only keep that many no-assist entries; discard the rest.

      interface RawGoalEvent {
        scorerRaw: string
        assistRaw: string | null
        scorerDisplay: string
        scorerPlayerId: string | null
        assistResolved: { displayName: string; playerId: string | null } | null
        isHome: boolean
      }

      const rawGoals: RawGoalEvent[] = []

      for (const event of events) {
        if (event.event_type !== 'goal' && event.event_type !== 'penalty_goal') continue
        if (!event.player?.trim()) continue

        const eventTeamName = (event as any).team_name as string | undefined
        if (teamName && eventTeamName && eventTeamName !== teamName) continue

        const isHome = (event as any).team_side === 'home'
        const scorerRaw = event.player.trim()
        const assistRaw = event.assist?.trim() || null
        const { displayName: scorerDisplay, playerId: scorerPlayerId } = resolveName(scorerRaw, rosterLookup)
        const assistResolved = assistRaw ? resolveName(assistRaw, rosterLookup) : null

        rawGoals.push({ scorerRaw, assistRaw, scorerDisplay, scorerPlayerId, assistResolved, isHome })
      }

      // Count per scorer how many events have / don't have an assist
      const withAssistCount = new Map<string, number>()
      const noAssistCount = new Map<string, number>()
      for (const ev of rawGoals) {
        if (ev.assistRaw !== null) {
          withAssistCount.set(ev.scorerRaw, (withAssistCount.get(ev.scorerRaw) ?? 0) + 1)
        } else {
          noAssistCount.set(ev.scorerRaw, (noAssistCount.get(ev.scorerRaw) ?? 0) + 1)
        }
      }

      // Insert deduplicated events
      const soloSlotsUsed = new Map<string, number>()

      for (const ev of rawGoals) {
        if (ev.assistRaw !== null) {
          // Combo goal – always keep
          db.insert(goalEvents)
            .values({
              gameId,
              teamId,
              season,
              gameDate: isoDate,
              scorerRawName: ev.scorerRaw,
              scorerDisplayName: ev.scorerDisplay,
              scorerPlayerId: ev.scorerPlayerId,
              assistRawName: ev.assistRaw,
              assistDisplayName: ev.assistResolved?.displayName ?? null,
              assistPlayerId: ev.assistResolved?.playerId ?? null,
              isHome: ev.isHome,
            })
            .run()
        } else {
          // No-assist event: only insert up to (noAssistCount - withAssistCount) times
          const realSoloSlots = Math.max(
            0,
            (noAssistCount.get(ev.scorerRaw) ?? 0) - (withAssistCount.get(ev.scorerRaw) ?? 0)
          )
          const used = soloSlotsUsed.get(ev.scorerRaw) ?? 0
          if (used < realSoloSlots) {
            soloSlotsUsed.set(ev.scorerRaw, used + 1)
            db.insert(goalEvents)
              .values({
                gameId,
                teamId,
                season,
                gameDate: isoDate,
                scorerRawName: ev.scorerRaw,
                scorerDisplayName: ev.scorerDisplay,
                scorerPlayerId: ev.scorerPlayerId,
                assistRawName: null,
                assistDisplayName: null,
                assistPlayerId: null,
                isHome: ev.isHome,
              })
              .run()
          }
          // else: duplicate artifact – skip
        }
      }
    } catch (err) {
      console.error(`[Chemistry] Error processing game ${gameId}:`, err)
      // Don't fail the whole analysis – mark as processed and continue
    }

    // Mark game as processed
    db.insert(processedGames)
      .values({ gameId, teamId, season, gameDate: isoDate })
      .onConflictDoNothing()
      .run()

    processed++

    // Update progress in DB after each game
    db.update(teamAnalysisState)
      .set({ gamesProcessed: processed, lastUpdatedAt: new Date().toISOString() })
      .where(and(eq(teamAnalysisState.teamId, teamId), eq(teamAnalysisState.season, season)))
      .run()
  }

  // ── Step 5: Mark as done ───────────────────────────────────
  db.update(teamAnalysisState)
    .set({ status: 'done', gamesProcessed: processed, lastUpdatedAt: new Date().toISOString() })
    .where(and(eq(teamAnalysisState.teamId, teamId), eq(teamAnalysisState.season, season)))
    .run()

  console.log(`[Chemistry] Analysis complete for team ${teamId} season ${season}: ${processed} games processed`)
}
