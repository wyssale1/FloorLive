import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import * as schema from './schema.js'

// Resolve __dirname in ESM context
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Store the SQLite file in the backend/data directory
const DB_PATH = join(__dirname, '../../data/chemistry.db')

const sqlite = new Database(DB_PATH)

// Enable WAL mode for better concurrent read performance
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

// Run migrations inline (create tables if not exists)
// We use raw SQL here to avoid needing a migrations folder at runtime
export function initDb() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS team_analysis_state (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id TEXT NOT NULL,
      season TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      has_roster INTEGER NOT NULL DEFAULT 0,
      games_total INTEGER NOT NULL DEFAULT 0,
      games_processed INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      last_updated_at TEXT NOT NULL,
      UNIQUE(team_id, season)
    );

    CREATE TABLE IF NOT EXISTS processed_games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      season TEXT NOT NULL,
      game_date TEXT NOT NULL,
      UNIQUE(game_id, team_id)
    );

    CREATE TABLE IF NOT EXISTS goal_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL,
      team_id TEXT NOT NULL,
      season TEXT NOT NULL,
      game_date TEXT NOT NULL,
      scorer_raw_name TEXT NOT NULL,
      scorer_display_name TEXT NOT NULL,
      scorer_player_id TEXT,
      assist_raw_name TEXT,
      assist_display_name TEXT,
      assist_player_id TEXT,
      is_home INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_goal_events_team_season
      ON goal_events(team_id, season);

    CREATE INDEX IF NOT EXISTS idx_goal_events_game_date
      ON goal_events(game_date);

    CREATE INDEX IF NOT EXISTS idx_processed_games_team
      ON processed_games(team_id, season);
  `)
}
