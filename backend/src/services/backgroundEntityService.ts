import { SwissUnihockeyApiClient } from './swissUnihockeyApi.js';
import { entityMasterService } from './entityMasterService.js';
import { TeamEntity, PlayerEntity } from '../shared/types/index.js';

interface UpdateJob {
  id: string;
  type: 'team' | 'player';
  entityId: string;
  name: string;
  priority: 'high' | 'normal' | 'low';
  retries: number;
  maxRetries: number;
  scheduledAt: Date;
}

export class BackgroundEntityService {
  private readonly apiClient: SwissUnihockeyApiClient;
  private readonly updateQueue: UpdateJob[] = [];
  private isProcessing = false;
  private readonly MAX_CONCURRENT_JOBS = 3;
  private readonly RETRY_DELAY_MS = 5000; // 5 seconds
  private readonly API_DELAY_MS = 500; // 500ms between API calls
  private runningJobs = 0;

  constructor() {
    this.apiClient = new SwissUnihockeyApiClient();
  }

  async scheduleEntityRefresh(entityId: string, entityType: 'team' | 'player', name: string, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<void> {
    const jobId = `${entityType}_${entityId}_${Date.now()}`;

    // Check if entity is already queued
    const existingJob = this.updateQueue.find(job =>
      job.entityId === entityId && job.type === entityType
    );

    if (existingJob) {
      return;
    }

    const job: UpdateJob = {
      id: jobId,
      type: entityType,
      entityId,
      name,
      priority,
      retries: 0,
      maxRetries: 3,
      scheduledAt: new Date()
    };

    // Insert job based on priority
    if (priority === 'high') {
      this.updateQueue.unshift(job);
    } else {
      this.updateQueue.push(job);
    }


    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  async scheduleExpiredEntitiesRefresh(): Promise<{teamsScheduled: number, playersScheduled: number}> {
    try {
      const [expiredTeams, expiredPlayers] = await Promise.all([
        entityMasterService.getExpiredTeams(),
        entityMasterService.getExpiredPlayers()
      ]);

      // Schedule team refreshes
      for (const team of expiredTeams) {
        await this.scheduleEntityRefresh(team.id, 'team', team.name, 'normal');
      }

      // Schedule player refreshes
      for (const player of expiredPlayers) {
        await this.scheduleEntityRefresh(player.id, 'player', player.name, 'normal');
      }

      if (expiredTeams.length > 0 || expiredPlayers.length > 0) {
        console.log(`Scheduled refresh for ${expiredTeams.length} expired teams and ${expiredPlayers.length} expired players`);
      }

      return {
        teamsScheduled: expiredTeams.length,
        playersScheduled: expiredPlayers.length
      };
    } catch (error) {
      console.error('❌ Failed to schedule expired entities refresh:', error);
      return { teamsScheduled: 0, playersScheduled: 0 };
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    while (this.updateQueue.length > 0 && this.runningJobs < this.MAX_CONCURRENT_JOBS) {
      const job = this.updateQueue.shift();
      if (job) {
        this.runningJobs++;
        this.processJob(job)
          .then(() => {
            this.runningJobs--;
          })
          .catch((error) => {
            console.error(`Job ${job.id} failed:`, error);
            this.runningJobs--;
          });

        // Add delay between starting jobs to avoid overwhelming API
        if (this.updateQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.API_DELAY_MS));
        }
      }
    }

    // Wait for all jobs to complete
    while (this.runningJobs > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
  }

  private async processJob(job: UpdateJob): Promise<void> {
    try {
      if (job.type === 'team') {
        await this.refreshTeam(job.entityId, job.name);
      } else {
        await this.refreshPlayer(job.entityId, job.name);
      }
    } catch (error) {
      console.error(`Failed to refresh ${job.type}:${job.entityId} (${job.name}):`, error);

      // Retry logic
      if (job.retries < job.maxRetries) {
        job.retries++;

        // Add back to queue with delay
        setTimeout(() => {
          this.updateQueue.push(job);
          if (!this.isProcessing) {
            this.processQueue();
          }
        }, this.RETRY_DELAY_MS * job.retries); // Exponential backoff
      } else {
        console.error(`Max retries exceeded for ${job.type}:${job.entityId} (${job.name})`);
      }
    }
  }

  private async refreshTeam(teamId: string, teamName: string): Promise<void> {
    try {
      // Fetch fresh team data from API
      const teamData = await this.apiClient.getTeamDetails(teamId);

      if (!teamData) {
        throw new Error(`Team ${teamId} not found in API`);
      }

      // Extract league information
      let league: string | undefined;
      if ((teamData as any).competitions && Array.isArray((teamData as any).competitions)) {
        const competitions = (teamData as any).competitions;
        if (competitions.length > 0) {
          league = competitions[0].name || competitions[0].league;
        }
      }

      // Update master registry
      await entityMasterService.addOrUpdateTeam(
        teamId,
        (teamData as any).name || teamName,
        league
      );

    } catch (error) {
      console.error(`Failed to refresh team ${teamId}:`, error);
      throw error;
    }
  }

  private async refreshPlayer(playerId: string, playerName: string): Promise<void> {
    try {
      // Fetch fresh player data from API
      const playerData = await this.apiClient.getPlayerDetails(playerId);

      if (!playerData) {
        throw new Error(`Player ${playerId} not found in API`);
      }

      // Extract team information
      let teamName: string | undefined;
      let teamId: string | undefined;

      if ((playerData as any).club) {
        teamName = (playerData as any).club.name;
        teamId = (playerData as any).club.id;
      } else if ((playerData as any).currentSeason) {
        teamName = (playerData as any).currentSeason.team;
      }

      // Update master registry
      await entityMasterService.addOrUpdatePlayer(
        playerId,
        (playerData as any).name || playerName,
        teamName,
        teamId
      );

    } catch (error) {
      console.error(`Failed to refresh player ${playerId}:`, error);
      throw error;
    }
  }

  // High-level trigger for user-initiated refreshes
  async triggerEntityRefresh(entityId: string, entityType: 'team' | 'player', name: string): Promise<void> {
    await this.scheduleEntityRefresh(entityId, entityType, name, 'high');
  }

  // Batch operations for efficient bulk updates
  async scheduleBulkTeamRefresh(teamIds: string[]): Promise<void> {
    for (const teamId of teamIds) {
      const team = await entityMasterService.getTeam(teamId);
      const name = team?.name || `Team ${teamId}`;
      await this.scheduleEntityRefresh(teamId, 'team', name, 'normal');
    }
  }

  async scheduleBulkPlayerRefresh(playerIds: string[]): Promise<void> {
    for (const playerId of playerIds) {
      const player = await entityMasterService.getPlayer(playerId);
      const name = player?.name || `Player ${playerId}`;
      await this.scheduleEntityRefresh(playerId, 'player', name, 'normal');
    }
  }

  // Queue status and monitoring
  getQueueStatus(): {
    queueLength: number;
    runningJobs: number;
    isProcessing: boolean;
    upcomingJobs: Array<{
      id: string;
      type: string;
      entityId: string;
      name: string;
      priority: string;
      retries: number;
    }>;
  } {
    return {
      queueLength: this.updateQueue.length,
      runningJobs: this.runningJobs,
      isProcessing: this.isProcessing,
      upcomingJobs: this.updateQueue.slice(0, 10).map(job => ({
        id: job.id,
        type: job.type,
        entityId: job.entityId,
        name: job.name,
        priority: job.priority,
        retries: job.retries
      }))
    };
  }

  // Auto-refresh scheduler - call this periodically
  async schedulePeriodicRefresh(): Promise<void> {
    console.log(`🔄 Running periodic entity refresh check...`);

    try {
      const result = await this.scheduleExpiredEntitiesRefresh();

      if (result.teamsScheduled === 0 && result.playersScheduled === 0) {
        console.log(`✅ No expired entities found - all up to date`);
      } else {
        console.log(`📅 Scheduled periodic refresh: ${result.teamsScheduled} teams, ${result.playersScheduled} players`);
      }
    } catch (error) {
      console.error('❌ Periodic refresh scheduling failed:', error);
    }
  }
}

// Singleton instance
export const backgroundEntityService = new BackgroundEntityService();