import { Router } from 'express';
import { SwissUnihockeyApiClient } from '../services/swissUnihockeyApi.js';
import { CacheService } from '../services/cacheService.js';
import { playerImageService } from '../services/playerImageService.js';

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

    // Check cache first
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

    // Process player images directly (check timestamps and refresh if needed)
    try {
      const playersData = [];
      const playersToProcess = [];
      
      // Extract player data and check who needs processing
      for (const player of (players as any[])) {
        if (player.id) {
          const playerData = {
            id: player.id,
            name: player.name || `Player ${player.id}`,
            imageUrl: player.profileImage
          };
          playersData.push(playerData);
          
          // Check if this player needs processing (older than 1 week or new)
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
      
      // If there are players to process, do it in the background (don't await)
      if (playersToProcess.length > 0) {
        // Get team name
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

        // Process players in background (fire and forget)
        processPlayersWithApiDetails(teamId, teamName, playersToProcess)
          .then(result => {
            console.log(`✅ Processed ${result.processed} players for team ${teamName} (${result.successful} successful, ${result.failed} failed)`);
          })
          .catch(error => {
            console.error('❌ Failed to process players for team:', teamId, error);
          });
        
        console.log(`🎯 Processing ${playersToProcess.length} players for team ${teamName} (${playersToProcess.length} need refresh)`);
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
        // Generate small image URLs for team player list
        const imagePaths = playerImageService.getPlayerImagePaths(player.id);
        const smallImageUrls = imagePaths ? {
          avif: imagePaths.small.avif,
          webp: imagePaths.small.webp,
          png: imagePaths.small.png
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

// GET /api/teams/:teamId/games - Get team upcoming games
router.get('/:teamId/games', async (req, res) => {
  try {
    const { teamId } = req.params;
    
    if (!teamId) {
      return res.status(400).json({ error: 'Team ID is required' });
    }

    const cacheKey = `team:${teamId}:games`;
    let games = cache.get(cacheKey);
    
    if (!games) {
      games = await apiClient.getTeamUpcomingGames(teamId);
      
      // Cache upcoming games for 30 minutes (they can change with schedule updates)
      cache.set(cacheKey, games, 1800000);
    }

    res.json({
      teamId,
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