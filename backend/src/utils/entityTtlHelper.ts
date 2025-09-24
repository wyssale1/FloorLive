import { entityMasterService, TeamEntity, PlayerEntity } from '../services/entityMasterService.js';
import { backgroundEntityService } from '../services/backgroundEntityService.js';

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
    const entity = await entityMasterService.getTeam(teamId);
    const shouldRefresh = this.isRefreshNeeded(entity);

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
    const entity = await entityMasterService.getPlayer(playerId);
    const shouldRefresh = this.isRefreshNeeded(entity);

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
    if (ttlResult.shouldRefresh) {
      await backgroundEntityService.scheduleEntityRefresh(teamId, 'team', teamName, 'normal')
        .catch(error => {
          console.error(`Failed to schedule team refresh for ${teamId}:`, error);
        });
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
    if (ttlResult.shouldRefresh) {
      // If new player, add stub first
      if (ttlResult.isNewEntity) {
        await entityMasterService.addPlayerStub(playerId, playerName, teamName, teamId);
      }

      // Schedule background refresh
      await backgroundEntityService.scheduleEntityRefresh(playerId, 'player', playerName, 'normal')
        .catch(error => {
          console.error(`Failed to schedule player refresh for ${playerId}:`, error);
        });
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
    if (!entity) {
      return true; // New entity needs refresh
    }

    try {
      if (!entity.ttl) return true;
      const now = new Date();
      const ttlDate = new Date(entity.ttl);
      return now > ttlDate; // Expired entities need refresh
    } catch (error) {
      return true; // Invalid TTL, treat as expired
    }
  }
}