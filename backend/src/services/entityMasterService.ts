import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BaseEntity,
  TeamEntity,
  PlayerEntity,
  Entity,
  EntityMasterData
} from '../types/services.js';

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
      console.log(`[ENTITY_CACHE] Cache already loaded - Teams: ${Object.keys(this.cache.teams).length}, Players: ${Object.keys(this.cache.players).length}`);
      return;
    }

    console.log(`[ENTITY_CACHE] Cache not loaded, initializing...`);

    // If there's already a loading operation in progress, wait for it
    if (this.loadingPromise) {
      console.log(`[ENTITY_CACHE] Loading already in progress, waiting...`);
      await this.loadingPromise;
      return;
    }

    // Start the loading operation and store the promise
    this.loadingPromise = this.performCacheLoad();

    try {
      await this.loadingPromise;
      console.log(`[ENTITY_CACHE] Cache loading completed`);
    } finally {
      // Clear the loading promise when done (success or failure)
      this.loadingPromise = null;
    }
  }

  private async performCacheLoad(): Promise<void> {
    const loadStartTime = Date.now();
    console.log(`[ENTITY_CACHE] Starting cache load from: ${this.MASTER_FILE}`);

    try {
      await fs.mkdir(this.DATA_DIR, { recursive: true });
      console.log(`[ENTITY_CACHE] Data directory ensured: ${this.DATA_DIR}`);

      try {
        console.log(`[ENTITY_CACHE] Reading master file...`);
        const data = await fs.readFile(this.MASTER_FILE, 'utf-8');
        console.log(`[ENTITY_CACHE] File read successfully, size: ${data.length} chars`);

        const parsedData = JSON.parse(data);
        console.log(`[ENTITY_CACHE] JSON parsed successfully`);

        // Validate the parsed data structure
        if (!parsedData || typeof parsedData !== 'object') {
          throw new Error('Invalid data structure in master file');
        }

        if (!parsedData.teams || !parsedData.players) {
          console.log(`[ENTITY_CACHE] Warning: Missing teams or players object in data`);
        }

        this.cache = parsedData;

        const teamCount = Object.keys(parsedData.teams || {}).length;
        const playerCount = Object.keys(parsedData.players || {}).length;
        console.log(`[ENTITY_CACHE] Cache loaded successfully - Teams: ${teamCount}, Players: ${playerCount}`);

      } catch (fileError) {
        console.log(`[ENTITY_CACHE] File read error, initializing empty cache:`, (fileError as Error).message);
        this.initializeEmptyCache();
        await this.saveMasterData();
      }

      this.cacheInitialized = true;
      const loadDuration = Date.now() - loadStartTime;
      console.log(`[ENTITY_CACHE] Cache initialization completed in ${loadDuration}ms`);

    } catch (error) {
      const loadDuration = Date.now() - loadStartTime;
      console.error(`[ENTITY_CACHE] Failed to initialize entity master cache after ${loadDuration}ms:`, error);
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
        if (!cacheTeam || (fileTeam.lastUpdated && cacheTeam.lastUpdated && new Date(fileTeam.lastUpdated) >= new Date(cacheTeam.lastUpdated))) {
          mergedTeams[teamId] = fileTeam; // File data wins for conflicts
        }
      }

      // Merge players: same strategy
      const mergedPlayers = { ...this.cache.players };
      for (const [playerId, filePlayer] of Object.entries(fileData.players)) {
        const cachePlayer = mergedPlayers[playerId];
        if (!cachePlayer || (filePlayer.lastUpdated && cachePlayer.lastUpdated && new Date(filePlayer.lastUpdated) >= new Date(cachePlayer.lastUpdated))) {
          mergedPlayers[playerId] = filePlayer; // File data wins for conflicts
        }
      }

      // Create final merged data
      const mergedData: EntityMasterData = {
        _metadata: {
          description: "Master entity registry for Swiss Unihockey teams and players",
          version: "1.0.0",
          schema: "EntityMasterData",
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
      if (!entity.ttl) return true;
      const ttlDate = new Date(entity.ttl);
      return new Date() > ttlDate;
    } catch (error) {
      return true; // If TTL is invalid, consider it expired
    }
  }

  // Team Methods
  async getTeam(teamId: string): Promise<TeamEntity | null> {
    await this.ensureCacheLoaded();
    return this.cache!.teams[teamId] || null;
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
    await this.ensureCacheLoaded();
    return this.cache!.players[playerId] || null;
  }

  async getAllPlayers(): Promise<PlayerEntity[]> {
    await this.ensureCacheLoaded();
    return Object.values(this.cache!.players);
  }

  async getPlayersByTeam(teamId: string): Promise<PlayerEntity[]> {
    await this.ensureCacheLoaded();
    const players: PlayerEntity[] = [];
    for (const player of Object.values(this.cache!.players)) {
      if (player.teamId === teamId) {
        players.push(player);
      }
    }
    return players;
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
    console.log(`[ENTITY_SEARCH] searchTeams called - query: "${query}", limit: ${limit}`);
    await this.ensureCacheLoaded();

    const totalTeams = Object.keys(this.cache!.teams).length;
    console.log(`[ENTITY_SEARCH] Total teams in cache: ${totalTeams}`);

    if (totalTeams === 0) {
      console.log(`[ENTITY_SEARCH] No teams in cache to search`);
      return [];
    }

    const normalizedQuery = query.toLowerCase();
    console.log(`[ENTITY_SEARCH] Normalized query: "${normalizedQuery}"`);

    const allTeams = Object.values(this.cache!.teams);
    console.log(`[ENTITY_SEARCH] Sample team names: ${allTeams.slice(0, 3).map(t => `"${t.name}"`).join(', ')}${allTeams.length > 3 ? '...' : ''}`);

    const matchedTeams = allTeams.filter(team =>
      team.name.toLowerCase().includes(normalizedQuery)
    );

    console.log(`[ENTITY_SEARCH] Teams matched: ${matchedTeams.length}`);

    const limitedResults = matchedTeams.slice(0, limit);
    console.log(`[ENTITY_SEARCH] Teams returned after limit: ${limitedResults.length}`);

    if (limitedResults.length > 0) {
      console.log(`[ENTITY_SEARCH] Sample results: ${limitedResults.slice(0, 2).map(t => `"${t.name}"`).join(', ')}`);
    }

    return limitedResults;
  }

  async searchPlayers(query: string, limit: number = 20): Promise<PlayerEntity[]> {
    console.log(`[ENTITY_SEARCH] searchPlayers called - query: "${query}", limit: ${limit}`);
    await this.ensureCacheLoaded();

    const totalPlayers = Object.keys(this.cache!.players).length;
    console.log(`[ENTITY_SEARCH] Total players in cache: ${totalPlayers}`);

    if (totalPlayers === 0) {
      console.log(`[ENTITY_SEARCH] No players in cache to search`);
      return [];
    }

    const normalizedQuery = query.toLowerCase();
    console.log(`[ENTITY_SEARCH] Normalized query: "${normalizedQuery}"`);

    const allPlayers = Object.values(this.cache!.players);
    console.log(`[ENTITY_SEARCH] Sample player names: ${allPlayers.slice(0, 3).map(p => `"${p.name}"`).join(', ')}${allPlayers.length > 3 ? '...' : ''}`);

    const matchedPlayers = allPlayers.filter(player =>
      player.name.toLowerCase().includes(normalizedQuery)
    );

    console.log(`[ENTITY_SEARCH] Players matched: ${matchedPlayers.length}`);

    const limitedResults = matchedPlayers
      .slice(0, limit)
      .map(player => ({
        ...player,
        jerseyNumber: (player as any).number || player.jerseyNumber
      }));

    console.log(`[ENTITY_SEARCH] Players returned after limit: ${limitedResults.length}`);

    if (limitedResults.length > 0) {
      console.log(`[ENTITY_SEARCH] Sample results: ${limitedResults.slice(0, 2).map(p => `"${p.name}"`).join(', ')}`);
    }

    return limitedResults;
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
      lastUpdated: this.cache!._metadata?.lastUpdated || new Date().toISOString()
    };
  }

  // Bulk operations for background processing
  async bulkUpdateTeams(teams: Array<{id: string, name: string, league?: string}>): Promise<void> {
    if (teams.length === 0) return;

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
    if (players.length === 0) return;

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