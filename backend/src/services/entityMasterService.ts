import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BaseEntity,
  TeamEntity,
  PlayerEntity,
  Entity,
  EntityMasterData
} from '../shared/types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class EntityMasterService {
  private readonly DATA_DIR = path.join(__dirname, '..', '..', 'data');
  private readonly MASTER_FILE = path.join(this.DATA_DIR, 'entities-master.json');
  private readonly TTL_DAYS = 7; // 1 week TTL as requested

  private cache: EntityMasterData | null = null;
  private cacheInitialized = false;
  private loadingPromise: Promise<void> | null = null;

  constructor() {
    this.initializeCacheSync();
  }

  private initializeCacheSync() {
    try {
      this.initializeEmptyCache();
    } catch (error) {
      this.initializeEmptyCache();
    }
  }

  private initializeEmptyCache() {
    this.cache = {
      _metadata: {
        description: "Master entity registry for Swiss Unihockey teams and players",
        version: "1.0.0",
        lastUpdated: new Date().toISOString(),
        instructions: "This file manages core entity data with TTL-based refresh. Feature services consume and extend this data."
      },
      teams: {},
      players: {}
    };
    // NOTE: Do NOT set cacheInitialized = true here, so ensureCacheLoaded() will load from file
  }

  async ensureCacheLoaded(): Promise<void> {
    // If cache is already loaded, return immediately
    if (this.cacheInitialized && this.cache) {
      console.log(`📋 [CACHE-DEBUG] Cache already loaded, returning immediately`);
      return;
    }

    // If there's already a loading operation in progress, wait for it
    if (this.loadingPromise) {
      console.log(`⏳ [CACHE-DEBUG] Loading already in progress, waiting...`);
      await this.loadingPromise;
      return;
    }

    // Start the loading operation and store the promise
    console.log(`🚀 [CACHE-DEBUG] Starting cache loading operation`);
    this.loadingPromise = this.performCacheLoad();

    try {
      await this.loadingPromise;
    } finally {
      // Clear the loading promise when done (success or failure)
      this.loadingPromise = null;
    }
  }

  private async performCacheLoad(): Promise<void> {
    try {
      console.log(`📁 [CACHE-DEBUG] Creating data directory: ${this.DATA_DIR}`);
      await fs.mkdir(this.DATA_DIR, { recursive: true });

      try {
        console.log(`📖 [CACHE-DEBUG] Reading master file: ${this.MASTER_FILE}`);
        const data = await fs.readFile(this.MASTER_FILE, 'utf-8');

        console.log(`🔍 [CACHE-DEBUG] Parsing JSON data (${data.length} characters)`);
        const parsedData = JSON.parse(data);

        // Validate the parsed data structure
        if (!parsedData || typeof parsedData !== 'object') {
          throw new Error('Invalid data structure in master file');
        }

        this.cache = parsedData;
        const teamCount = Object.keys(this.cache.teams || {}).length;
        const playerCount = Object.keys(this.cache.players || {}).length;

        console.log(`✅ [CACHE-DEBUG] Successfully loaded cache with ${teamCount} teams and ${playerCount} players`);

      } catch (fileError) {
        console.log(`⚠️ [CACHE-DEBUG] Could not read master file, initializing empty cache:`, fileError);
        this.initializeEmptyCache();
        await this.saveMasterData();
      }

      this.cacheInitialized = true;
      console.log(`🎉 [CACHE-DEBUG] Cache initialization completed successfully`);

    } catch (error) {
      console.error('💥 [CACHE-DEBUG] Failed to initialize entity master cache:', error);
      this.initializeEmptyCache();
      this.cacheInitialized = true; // Set to true even on failure to prevent infinite retries
    }
  }

  private async mergeWithFileData(): Promise<EntityMasterData> {
    try {
      const data = await fs.readFile(this.MASTER_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is corrupted, return current cache
      return this.cache || this.createEmptyCache();
    }
  }

  private createEmptyCache(): EntityMasterData {
    return {
      _metadata: {
        description: "Master entity registry for Swiss Unihockey teams and players",
        version: "1.0.0",
        lastUpdated: new Date().toISOString(),
        instructions: "This file manages core entity data with TTL-based refresh. Feature services consume and extend this data."
      },
      teams: {},
      players: {}
    };
  }

  private async saveMasterData(): Promise<void> {
    if (!this.cache) return;

    try {
      // CRITICAL FIX: Always merge with current file data before saving
      const fileData = await this.mergeWithFileData();

      // Merge teams: file data takes precedence for existing entities, new entities are added
      const mergedTeams = { ...this.cache.teams };
      for (const [teamId, fileTeam] of Object.entries(fileData.teams)) {
        const cacheTeam = mergedTeams[teamId];
        if (!cacheTeam || new Date(fileTeam.lastUpdated) >= new Date(cacheTeam.lastUpdated)) {
          mergedTeams[teamId] = fileTeam; // File data wins for conflicts
        }
      }

      // Merge players: same strategy
      const mergedPlayers = { ...this.cache.players };
      for (const [playerId, filePlayer] of Object.entries(fileData.players)) {
        const cachePlayer = mergedPlayers[playerId];
        if (!cachePlayer || new Date(filePlayer.lastUpdated) >= new Date(cachePlayer.lastUpdated)) {
          mergedPlayers[playerId] = filePlayer; // File data wins for conflicts
        }
      }

      // Create final merged data
      const mergedData: EntityMasterData = {
        _metadata: {
          ...fileData._metadata,
          lastUpdated: new Date().toISOString()
        },
        teams: mergedTeams,
        players: mergedPlayers
      };

      // Update cache with merged data
      this.cache = mergedData;

      // Write merged data atomically
      await fs.writeFile(this.MASTER_FILE, JSON.stringify(mergedData, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save entity master data:', error);
      throw error;
    }
  }

  private calculateTtl(): string {
    const future = new Date();
    future.setDate(future.getDate() + this.TTL_DAYS);
    return future.toISOString();
  }

  private isEntityExpired(entity: Entity): boolean {
    try {
      const ttlDate = new Date(entity.ttl);
      return new Date() > ttlDate;
    } catch (error) {
      return true; // If TTL is invalid, consider it expired
    }
  }

  // Team Methods
  async getTeam(teamId: string): Promise<TeamEntity | null> {
    console.log(`🔍 [ENTITY-DEBUG] Looking up team: ${teamId}`);
    await this.ensureCacheLoaded();

    const team = this.cache!.teams[teamId] || null;
    if (team) {
      console.log(`✅ [ENTITY-DEBUG] Found team: ${teamId} (${team.name})`);
    } else {
      console.log(`❌ [ENTITY-DEBUG] Team not found: ${teamId}`);
      console.log(`📋 [ENTITY-DEBUG] Available teams: ${Object.keys(this.cache!.teams).length} total`);
    }

    return team;
  }

  async getAllTeams(): Promise<TeamEntity[]> {
    await this.ensureCacheLoaded();
    return Object.values(this.cache!.teams);
  }

  async addOrUpdateTeam(teamId: string, name: string, league?: string): Promise<TeamEntity> {
    await this.ensureCacheLoaded();

    const now = new Date().toISOString();
    const team: TeamEntity = {
      type: 'team',
      id: teamId,
      name,
      league,
      lastUpdated: now,
      ttl: this.calculateTtl()
    };

    this.cache!.teams[teamId] = team;
    await this.saveMasterData();

    return team;
  }

  async getExpiredTeams(): Promise<TeamEntity[]> {
    await this.ensureCacheLoaded();
    return Object.values(this.cache!.teams).filter(team => this.isEntityExpired(team));
  }

  // Player Methods
  async getPlayer(playerId: string): Promise<PlayerEntity | null> {
    console.log(`🔍 [ENTITY-DEBUG] Looking up player: ${playerId}`);
    await this.ensureCacheLoaded();

    const player = this.cache!.players[playerId] || null;
    if (player) {
      console.log(`✅ [ENTITY-DEBUG] Found player: ${playerId} (${player.name})`);
    } else {
      console.log(`❌ [ENTITY-DEBUG] Player not found: ${playerId}`);
      console.log(`📋 [ENTITY-DEBUG] Available players: ${Object.keys(this.cache!.players).length} total`);
      console.log(`🔑 [ENTITY-DEBUG] First 5 player IDs: ${Object.keys(this.cache!.players).slice(0, 5).join(', ')}`);
    }

    return player;
  }

  async getAllPlayers(): Promise<PlayerEntity[]> {
    await this.ensureCacheLoaded();
    return Object.values(this.cache!.players);
  }

  async getPlayersByTeam(teamId: string): Promise<PlayerEntity[]> {
    await this.ensureCacheLoaded();
    return Object.values(this.cache!.players).filter(player => player.teamId === teamId);
  }

  async addOrUpdatePlayer(playerId: string, name: string, teamName?: string, teamId?: string): Promise<PlayerEntity> {
    await this.ensureCacheLoaded();

    const now = new Date().toISOString();
    const player: PlayerEntity = {
      type: 'player',
      id: playerId,
      name,
      team: teamName,
      teamId,
      lastUpdated: now,
      ttl: this.calculateTtl()
    };

    this.cache!.players[playerId] = player;
    await this.saveMasterData();

    return player;
  }

  async addPlayerStub(playerId: string, name: string, teamName?: string, teamId?: string): Promise<PlayerEntity> {
    await this.ensureCacheLoaded();

    // Only add if player doesn't exist (for discovery only)
    if (this.cache!.players[playerId]) {
      return this.cache!.players[playerId];
    }

    const now = new Date().toISOString();
    const player: PlayerEntity = {
      type: 'player',
      id: playerId,
      name,
      team: teamName,
      teamId,
      lastUpdated: now,
      ttl: this.calculateTtl()
    };

    this.cache!.players[playerId] = player;
    await this.saveMasterData();

    return player;
  }

  async getExpiredPlayers(): Promise<PlayerEntity[]> {
    await this.ensureCacheLoaded();
    return Object.values(this.cache!.players).filter(player => this.isEntityExpired(player));
  }

  // Search Methods
  async searchTeams(query: string, limit: number = 20): Promise<TeamEntity[]> {
    await this.ensureCacheLoaded();
    const normalizedQuery = query.toLowerCase();

    return Object.values(this.cache!.teams)
      .filter(team =>
        team.name.toLowerCase().includes(normalizedQuery) ||
        (team.league && team.league.toLowerCase().includes(normalizedQuery))
      )
      .slice(0, limit);
  }

  async searchPlayers(query: string, limit: number = 20): Promise<PlayerEntity[]> {
    await this.ensureCacheLoaded();
    const normalizedQuery = query.toLowerCase();

    return Object.values(this.cache!.players)
      .filter(player =>
        player.name.toLowerCase().includes(normalizedQuery) ||
        (player.team && player.team.toLowerCase().includes(normalizedQuery))
      )
      .slice(0, limit);
  }

  // Statistics and Health
  async getStats(): Promise<{
    totalTeams: number;
    totalPlayers: number;
    expiredTeams: number;
    expiredPlayers: number;
    lastUpdated: string;
  }> {
    await this.ensureCacheLoaded();

    const teams = Object.values(this.cache!.teams);
    const players = Object.values(this.cache!.players);

    return {
      totalTeams: teams.length,
      totalPlayers: players.length,
      expiredTeams: teams.filter(team => this.isEntityExpired(team)).length,
      expiredPlayers: players.filter(player => this.isEntityExpired(player)).length,
      lastUpdated: this.cache!._metadata.lastUpdated
    };
  }

  // Bulk operations for background processing
  async bulkUpdateTeams(teams: Array<{id: string, name: string, league?: string}>): Promise<void> {
    await this.ensureCacheLoaded();

    const now = new Date().toISOString();
    const ttl = this.calculateTtl();

    for (const teamData of teams) {
      this.cache!.teams[teamData.id] = {
        type: 'team',
        id: teamData.id,
        name: teamData.name,
        league: teamData.league,
        lastUpdated: now,
        ttl
      };
    }

    await this.saveMasterData();
  }

  async bulkUpdatePlayers(players: Array<{id: string, name: string, team?: string, teamId?: string}>): Promise<void> {
    await this.ensureCacheLoaded();

    const now = new Date().toISOString();
    const ttl = this.calculateTtl();

    for (const playerData of players) {
      this.cache!.players[playerData.id] = {
        type: 'player',
        id: playerData.id,
        name: playerData.name,
        team: playerData.team,
        teamId: playerData.teamId,
        lastUpdated: now,
        ttl
      };
    }

    await this.saveMasterData();
  }
}

// Singleton instance
export const entityMasterService = new EntityMasterService();