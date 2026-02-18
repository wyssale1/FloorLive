import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// Tracks which teams/seasons have been analysed and their processing state
export const teamAnalysisState = sqliteTable('team_analysis_state', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teamId: text('team_id').notNull(),
  season: text('season').notNull(),           // e.g. "2025"
  status: text('status').notNull().default('pending'), // 'pending'|'processing'|'done'|'error'
  hasRoster: integer('has_roster', { mode: 'boolean' }).notNull().default(false),
  gamesTotal: integer('games_total').notNull().default(0),
  gamesProcessed: integer('games_processed').notNull().default(0),
  errorMessage: text('error_message'),
  lastUpdatedAt: text('last_updated_at').notNull(),   // ISO timestamp
})

// Tracks which individual game IDs have been processed (for incremental updates)
export const processedGames = sqliteTable('processed_games', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  gameId: text('game_id').notNull(),
  teamId: text('team_id').notNull(),
  season: text('season').notNull(),
  gameDate: text('game_date').notNull(),       // ISO date "YYYY-MM-DD"
})

// One row per goal event scored by the team (core data)
export const goalEvents = sqliteTable('goal_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  gameId: text('game_id').notNull(),
  teamId: text('team_id').notNull(),
  season: text('season').notNull(),
  gameDate: text('game_date').notNull(),       // ISO date "YYYY-MM-DD"

  // Scorer fields
  scorerRawName: text('scorer_raw_name').notNull(),       // "A. Wyss" — aggregation key
  scorerDisplayName: text('scorer_display_name').notNull(), // "Alexander Wyss" or same as raw
  scorerPlayerId: text('scorer_player_id'),               // Real API ID or NULL

  // Assist fields (NULL if no assist / solo goal)
  assistRawName: text('assist_raw_name'),
  assistDisplayName: text('assist_display_name'),
  assistPlayerId: text('assist_player_id'),               // Real API ID or NULL

  isHome: integer('is_home', { mode: 'boolean' }).notNull(), // true = home goal, false = away

  // Game phase: 'regular' | 'cup' | 'playoff'
  // 'regular'  = regular season rounds (Runde X)
  // 'cup'      = Mobiliar Unihockey Cup
  // 'playoff'  = Playoff / Playout (post-regular elimination rounds)
  gamePhase: text('game_phase').notNull().default('regular'),
})
