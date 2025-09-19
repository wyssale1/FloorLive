import { entityMasterService } from '../services/entityMasterService.js';
import { backgroundEntityService } from '../services/backgroundEntityService.js';
import { TeamEntity, PlayerEntity } from '../shared/types/index.js';

export interface TtlCheckResult {
  shouldRefresh: boolean;
  entity: TeamEntity | PlayerEntity | null;
  isNewEntity: boolean;
}

/**
 * Unified TTL checking and refresh scheduling for all entity types
 * Follows DRY principles by centralizing TTL logic across all routes
 */
export class EntityTtlHelper {

  /**
   * Check TTL for a team and schedule refresh if needed
   */
  static async checkTeamTtl(teamId: string): Promise<TtlCheckResult> {
    console.log(`🔍 [TTL-DEBUG] Checking team TTL for: ${teamId}`);

    const entity = await entityMasterService.getTeam(teamId);

    if (entity) {
      console.log(`📋 [TTL-DEBUG] Found team entity:`, {
        id: entity.id,
        name: entity.name,
        lastUpdated: entity.lastUpdated,
        ttl: entity.ttl
      });
    } else {
      console.log(`❌ [TTL-DEBUG] No team entity found for: ${teamId}`);
    }

    const shouldRefresh = this.isRefreshNeeded(entity);

    console.log(`⚖️ [TTL-DEBUG] Team ${teamId} TTL check result: shouldRefresh=${shouldRefresh}`);

    return {
      shouldRefresh,
      entity,
      isNewEntity: entity === null
    };
  }

  /**
   * Check TTL for a player and schedule refresh if needed
   */
  static async checkPlayerTtl(playerId: string): Promise<TtlCheckResult> {
    console.log(`🔍 [TTL-DEBUG] Checking player TTL for: ${playerId}`);

    const entity = await entityMasterService.getPlayer(playerId);

    if (entity) {
      console.log(`📋 [TTL-DEBUG] Found player entity:`, {
        id: entity.id,
        name: entity.name,
        lastUpdated: entity.lastUpdated,
        ttl: entity.ttl
      });
    } else {
      console.log(`❌ [TTL-DEBUG] No player entity found for: ${playerId}`);
    }

    const shouldRefresh = this.isRefreshNeeded(entity);

    console.log(`⚖️ [TTL-DEBUG] Player ${playerId} TTL check result: shouldRefresh=${shouldRefresh}`);

    return {
      shouldRefresh,
      entity,
      isNewEntity: entity === null
    };
  }

  /**
   * Schedule background refresh for a team if TTL check indicates it's needed
   */
  static async scheduleTeamRefreshIfNeeded(
    teamId: string,
    teamName: string,
    ttlResult: TtlCheckResult
  ): Promise<void> {
    console.log(`🚀 [TTL-DEBUG] Team scheduling decision for ${teamId} (${teamName}): shouldRefresh=${ttlResult.shouldRefresh}`);

    if (ttlResult.shouldRefresh) {
      console.log(`📅 [TTL-DEBUG] SCHEDULING background refresh for team ${teamId}`);
      await backgroundEntityService.scheduleEntityRefresh(teamId, 'team', teamName, 'normal')
        .catch(error => {
          console.error(`Failed to schedule team refresh for ${teamId}:`, error);
        });
      console.log(`✅ [TTL-DEBUG] Background refresh scheduled for team ${teamId}`);
    } else {
      console.log(`⏳ [TTL-DEBUG] SKIPPING refresh for team ${teamId} - TTL still valid`);
    }
  }

  /**
   * Schedule background refresh for a player if TTL check indicates it's needed
   */
  static async schedulePlayerRefreshIfNeeded(
    playerId: string,
    playerName: string,
    ttlResult: TtlCheckResult,
    teamName?: string,
    teamId?: string
  ): Promise<void> {
    console.log(`🚀 [TTL-DEBUG] Player scheduling decision for ${playerId} (${playerName}): shouldRefresh=${ttlResult.shouldRefresh}, isNewEntity=${ttlResult.isNewEntity}`);

    if (ttlResult.shouldRefresh) {
      // If new player, add stub first
      if (ttlResult.isNewEntity) {
        console.log(`🆕 [TTL-DEBUG] Adding new player stub for ${playerId}`);
        await entityMasterService.addPlayerStub(playerId, playerName, teamName, teamId);
        console.log(`✅ [TTL-DEBUG] Player stub added for ${playerId}`);
      }

      // Schedule background refresh
      console.log(`📅 [TTL-DEBUG] SCHEDULING background refresh for player ${playerId}`);
      await backgroundEntityService.scheduleEntityRefresh(playerId, 'player', playerName, 'normal')
        .catch(error => {
          console.error(`Failed to schedule player refresh for ${playerId}:`, error);
        });
      console.log(`✅ [TTL-DEBUG] Background refresh scheduled for player ${playerId}`);
    } else {
      console.log(`⏳ [TTL-DEBUG] SKIPPING refresh for player ${playerId} - TTL still valid`);
    }
  }

  /**
   * Complete workflow: check TTL and schedule refresh for team
   */
  static async checkAndScheduleTeamRefresh(teamId: string, teamName: string): Promise<TtlCheckResult> {
    const ttlResult = await this.checkTeamTtl(teamId);
    await this.scheduleTeamRefreshIfNeeded(teamId, teamName, ttlResult);
    return ttlResult;
  }

  /**
   * Complete workflow: check TTL and schedule refresh for player
   */
  static async checkAndSchedulePlayerRefresh(
    playerId: string,
    playerName: string,
    teamName?: string,
    teamId?: string
  ): Promise<TtlCheckResult> {
    const ttlResult = await this.checkPlayerTtl(playerId);
    await this.schedulePlayerRefreshIfNeeded(playerId, playerName, ttlResult, teamName, teamId);
    return ttlResult;
  }

  /**
   * Private helper: determine if entity needs refresh based on TTL
   */
  private static isRefreshNeeded(entity: TeamEntity | PlayerEntity | null): boolean {
    console.log(`🕐 [TTL-DEBUG] Starting TTL refresh check...`);

    if (!entity) {
      console.log(`❌ [TTL-DEBUG] Entity is null/undefined -> NEEDS REFRESH`);
      return true; // New entity needs refresh
    }

    try {
      const now = new Date();
      const ttlDate = new Date(entity.ttl);
      const needsRefresh = now > ttlDate;

      console.log(`📅 [TTL-DEBUG] TTL Date Comparison:`, {
        entityId: entity.id,
        entityName: entity.name,
        currentTime: now.toISOString(),
        ttlExpires: ttlDate.toISOString(),
        timeUntilExpiry: `${Math.round((ttlDate.getTime() - now.getTime()) / (1000 * 60))} minutes`,
        needsRefresh: needsRefresh,
        comparison: `${now.toISOString()} > ${ttlDate.toISOString()} = ${needsRefresh}`
      });

      return needsRefresh; // Expired entities need refresh
    } catch (error) {
      console.log(`💥 [TTL-DEBUG] TTL parsing error:`, error, `-> NEEDS REFRESH`);
      return true; // Invalid TTL, treat as expired
    }
  }
}