/**
 * Service Layer Types
 *
 * Types for backend services like entity management, caching, websockets, etc.
 * These are internal service contracts and data structures.
 */

// Entity Management Types
export interface BaseEntity {
  id: string;
  name: string;
  lastUpdated?: string;
  ttl?: string;
}

export interface TeamEntity extends BaseEntity {
  type: 'team';
  shortName?: string;
  logo?: string;
  league?: string;
}

export interface PlayerEntity extends BaseEntity {
  type: 'player';
  teamId?: string;
  team?: string;
  position?: string;
  profileImage?: string;
  jerseyNumber?: string;
}

export type Entity = TeamEntity | PlayerEntity;

export interface EntityMasterData {
  version?: string;
  lastUpdated?: string;
  teams: Record<string, TeamEntity>;
  players: Record<string, PlayerEntity>;
  stats?: {
    totalTeams: number;
    totalPlayers: number;
  };
  _metadata?: {
    version?: string;
    schema?: string;
    description: string;
    lastUpdated: string;
    instructions?: string;
  };
}

// Cache Service Types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
}

// WebSocket Service Types
export interface WebSocketMessage {
  type: 'game_update' | 'live_games' | 'score_update' | 'status_update';
  data: any;
  timestamp: string;
}

export interface WebSocketConnection {
  id: string;
  connected: boolean;
  subscriptions: string[];
  lastPing: number;
}

// Request Batcher Types
export interface BatchedRequest<T> {
  key: string;
  promise: Promise<T>;
  timestamp: number;
}

// SEO Service Types
export interface SeoData {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  openGraph?: {
    title: string;
    description: string;
    type: string;
    url: string;
    image?: string;
  };
}

// Scheduler Service Types
export interface ScheduledTask {
  id: string;
  name: string;
  interval: number;
  lastRun?: Date;
  nextRun: Date;
  isRunning: boolean;
}

// Asset Service Types
export interface LogoUrls {
  large: Record<string, string>; // { avif: url, webp: url, png: url }
  small: Record<string, string>;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

// Background Processing Types
export interface BackgroundTask {
  id: string;
  type: 'logo_processing' | 'entity_refresh' | 'cache_cleanup';
  status: 'pending' | 'running' | 'completed' | 'failed';
  data: any;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}