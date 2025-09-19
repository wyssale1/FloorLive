import { Router } from 'express';
import { SwissUnihockeyApiClient } from '../services/swissUnihockeyApi.js';
import { CacheService } from '../services/cacheService.js';
import { playerImageService } from '../services/playerImageService.js';
import { entityMasterService } from '../services/entityMasterService.js';
import { backgroundEntityService } from '../services/backgroundEntityService.js';

const router = Router();
const apiClient = new SwissUnihockeyApiClient();
const cache = new CacheService();

// Helper function to process players with API details fetching
async function processPlayersWithApiDetails(
  teamId: string, 
  teamName: string, 
  playersToProcess: Array<{id: string, name: string, imageUrl?: string}>
): Promise<{processed: number, successful: number, failed: number}> {
  let processed = 0;
  let successful = 0;
  let failed = 0;

  for (const [index, player] of playersToProcess.entries()) {
    try {
      // Add delay between API calls to be respectful (500ms)
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const success = await playerImageService.processPlayerWithApiFetch(
        player.id, 
        player.name, 
        { teamId, teamName }
      );
      
      if (success) {
        successful++;
      } else {
        failed++;
      }
      processed++;
      
    } catch (error) {
      console.error(`❌ Failed to process player ${player.name}:`, error);
      failed++;
      processed++;
    }
  }

  return { processed, successful, failed };
}

// GET /api/teams/:teamId - Get team details
router.get('/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;

    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    // Check master registry for team entity (background refresh logic)
    const teamEntity = await entityMasterService.getTeam(teamId);
    let shouldRefresh = false;

    if (!teamEntity) {
      // New team - add to registry and mark for refresh
      shouldRefresh = true;
      console.log(`🆕 New team discovered: ${teamId}`);
    } else {
      // Check if team needs refresh based on TTL
      const ttlDate = new Date(teamEntity.ttl);
      if (new Date() > ttlDate) {
        shouldRefresh = true;
        console.log(`🕐 Team ${teamId} (${teamEntity.name}) needs refresh`);
      }
    }

    // Check API cache first for immediate response
    const cacheKey = `team:${teamId}`;
    let team = cache.get(cacheKey);

    if (!team) {
      team = await apiClient.getTeamDetails(teamId);

      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      // Cache team details for 1 hour (they don't change frequently)
      cache.set(cacheKey, team, 3600000);
    }

    // Schedule background refresh if needed (non-blocking)
    if (shouldRefresh) {
      const teamName = (team as any).name || `Team ${teamId}`;

      if (!teamEntity) {
        console.log(`🆕 New team discovered: ${teamName} (${teamId}) - scheduling background refresh`);
      } else {
        console.log(`🕐 Team ${teamName} (${teamId}) TTL expired - scheduling background refresh`);
      }

      backgroundEntityService.scheduleEntityRefresh(teamId, 'team', teamName, 'normal')
        .catch(error => {
          console.error(`❌ Failed to schedule team refresh for ${teamId}:`, error);
        });
    } else if (teamEntity) {
      console.log(`✅ Team ${teamEntity.name} (${teamId}) TTL valid - no refresh needed`);
    }

    res.json(team);

  } catch (error) {
    console.error('Error fetching team details:', error);
    res.status(500).json({
      error: 'Failed to fetch team details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/teams/:teamId/players - Get team players/roster
router.get('/:teamId/players', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    const cacheKey = `team:${teamId}:players`;
    let players = cache.get(cacheKey);
    
    if (!players) {
      players = await apiClient.getTeamPlayers(teamId);
      
      // Cache players for 6 hours (roster doesn't change very often)
      cache.set(cacheKey, players, 21600000);
    }

    // Process players: add to master registry and check for updates
    try {
      const playersData = [];
      const playersToProcess = [];
      const playersToRefresh = [];

      // Get team name for player entities
      let teamName = `Team ${teamId}`;
      try {
        const teamCacheKey = `team:${teamId}`;
        let teamDetails = cache.get(teamCacheKey);
        if (!teamDetails) {
          teamDetails = await apiClient.getTeamDetails(teamId);
          if (teamDetails) {
            cache.set(teamCacheKey, teamDetails, 3600000);
          }
        }
        if (teamDetails && (teamDetails as any).name) {
          teamName = (teamDetails as any).name;
        }
      } catch (error) {
        console.warn('Could not get team name, using default');
      }

      // Extract player data and check who needs processing
      for (const player of (players as any[])) {
        if (player.id) {
          const playerName = player.name || `Player ${player.id}`;
          const playerData = {
            id: player.id,
            name: playerName,
            imageUrl: player.profileImage
          };
          playersData.push(playerData);

          // Check master registry for player entity (non-blocking approach)
          const playerEntity = await entityMasterService.getPlayer(player.id);
          let shouldRefreshPlayer = false;

          if (!playerEntity) {
            // New player - add stub to master registry (minimal data, non-blocking)
            await entityMasterService.addPlayerStub(player.id, playerName, teamName, teamId);
            shouldRefreshPlayer = true;
            console.log(`🆕 New player discovered: ${playerName} (${player.id}) - added stub to registry`);
          } else {
            // Check if player needs refresh based on TTL (background only)
            const ttlDate = new Date(playerEntity.ttl);
            if (new Date() > ttlDate) {
              shouldRefreshPlayer = true;
              console.log(`🕐 Player ${playerName} (${player.id}) TTL expired - scheduling background refresh`);
            } else {
              console.log(`✅ Player ${playerName} (${player.id}) TTL valid - no refresh needed`);
            }
          }

          if (shouldRefreshPlayer) {
            playersToRefresh.push({ id: player.id, name: playerName });
          }

          // Check if this player needs image processing (legacy system)
          const metadata = playerImageService.getPlayerMetadata(player.id);
          if (!metadata) {
            // New player - needs processing
            playersToProcess.push(playerData);
          } else {
            // Check if data is older than 1 week
            const lastUpdated = new Date(metadata.lastUpdated);
            const now = new Date();
            const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

            if (daysSinceUpdate >= 7) {
              playersToProcess.push(playerData);
            }
          }
        }
      }
      // Schedule background player entity refreshes (non-blocking)
      if (playersToRefresh.length > 0) {
        for (const player of playersToRefresh) {
          backgroundEntityService.scheduleEntityRefresh(player.id, 'player', player.name, 'normal')
            .catch(error => {
              console.error(`❌ Failed to schedule player refresh for ${player.id}:`, error);
            });
        }
        console.log(`🔄 Scheduled ${playersToRefresh.length} players for entity refresh`);
      }

      // If there are players to process for images, do it in the background (don't await)
      if (playersToProcess.length > 0) {
        // Process players in background (fire and forget)
        processPlayersWithApiDetails(teamId, teamName, playersToProcess)
          .then(result => {
            console.log(`✅ Processed ${result.processed} players for team ${teamName} (${result.successful} successful, ${result.failed} failed)`);
          })
          .catch(error => {
            console.error('❌ Failed to process players for team:', teamId, error);
          });

        console.log(`🎯 Processing ${playersToProcess.length} players for team ${teamName} (${playersToProcess.length} need image refresh)`);
      }
    } catch (error) {
      // Don't fail the request if background processing fails
      console.error('Error processing players for team:', teamId, error);
    }

    // Check for duplicate jersey numbers (debug logging)
    const numberCounts = new Map();
    (players as any[]).forEach(player => {
      if (player.number) {
        const count = numberCounts.get(player.number) || 0;
        numberCounts.set(player.number, count + 1);
      }
    });
    
    // Log any duplicate numbers
    for (const [number, count] of numberCounts.entries()) {
      if (count > 1) {
        console.warn(`⚠️  Duplicate jersey number ${number} found ${count} times in team ${teamId}`);
        const duplicatePlayers = (players as any[]).filter(p => p.number === number);
        duplicatePlayers.forEach(p => console.warn(`   - Player: ${p.name} (ID: ${p.id})`));
      }
    }

    // Enhance players with image information
    const playersWithImages = (players as any[]).map(player => {
      if (!player.id) {
        return {
          ...player,
          imageInfo: {
            hasImage: false
          }
        };
      }

      // Check if player has processed images
      const metadata = playerImageService.getPlayerMetadata(player.id);
      if (metadata?.hasImage) {
        // Generate small image URLs for team player list (including high-DPI variants)
        const imagePaths = playerImageService.getPlayerImagePaths(player.id);
        const smallImageUrls = imagePaths ? {
          // 1x images
          avif: imagePaths.small.avif,
          webp: imagePaths.small.webp,
          png: imagePaths.small.png,
          // 2x retina images
          avif2x: imagePaths.small2x?.avif,
          webp2x: imagePaths.small2x?.webp,
          png2x: imagePaths.small2x?.png,
          // 3x retina images
          avif3x: imagePaths.small3x?.avif,
          webp3x: imagePaths.small3x?.webp,
          png3x: imagePaths.small3x?.png
        } : null;

        return {
          ...player,
          imageInfo: {
            hasImage: true,
            smallImageUrls
          }
        };
      }

      return {
        ...player,
        imageInfo: {
          hasImage: false
        }
      };
    });

    res.json({
      teamId,
      players: playersWithImages,
      count: playersWithImages.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching team players:', error);
    res.status(500).json({
      error: 'Failed to fetch team players',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/teams/:teamId/statistics - Get team statistics
router.get('/:teamId/statistics', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    const cacheKey = `team:${teamId}:statistics`;
    let statistics = cache.get(cacheKey);
    
    if (!statistics) {
      statistics = await apiClient.getTeamStatistics(teamId);
      
      if (!statistics) {
        return res.status(404).json({ error: 'Team statistics not found' });
      }

      // Cache statistics for 24 hours (historical data doesn't change)
      cache.set(cacheKey, statistics, 86400000);
    }

    res.json({
      teamId,
      statistics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching team statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch team statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/teams/:teamId/competitions - Get team competitions
router.get('/:teamId/competitions', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    const cacheKey = `team:${teamId}:competitions`;
    let competitions = cache.get(cacheKey);
    
    if (!competitions) {
      competitions = await apiClient.getTeamCompetitions(teamId);
      
      // Cache competitions for 6 hours (they don't change often)
      cache.set(cacheKey, competitions, 21600000);
    }

    res.json({
      teamId,
      competitions,
      count: (competitions as any[]).length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching team competitions:', error);
    res.status(500).json({
      error: 'Failed to fetch team competitions',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/teams/:teamId/games - Get team games (all games for current season)
router.get('/:teamId/games', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { season } = req.query;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    // Create cache key that includes season parameter
    const cacheKey = `team:${teamId}:games:${season || 'current'}`;
    let games = cache.get(cacheKey);
    
    if (!games) {
      games = await apiClient.getTeamGames(teamId, season as string);
      
      // Cache games for 30 minutes (they can change with schedule updates)
      cache.set(cacheKey, games, 1800000);
    }

    res.json({
      teamId,
      season: season || 'current',
      games,
      count: (games as any[]).length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching team games:', error);
    res.status(500).json({
      error: 'Failed to fetch team games',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;