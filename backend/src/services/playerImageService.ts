import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { SwissUnihockeyApiClient } from './swissUnihockeyApi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PlayerImageMetadata {
  playerId: string;
  playerName: string;
  originalUrl?: string;
  downloadedAt?: string;
  processedAt?: string;
  lastUpdated: string;
  sizes: {
    small: { width: number; height: number; }; // For team player list
    medium: { width: number; height: number; }; // For player detail page
  };
  formats: readonly string[];
  fileSize: {
    small: Record<string, number>;
    medium: Record<string, number>;
  };
  hasImage: boolean; // Whether player actually has an image
}

interface PlayerCache {
  version: string;
  players: Record<string, PlayerImageMetadata>;
  lastUpdated: string;
  searchIndex: PlayerSearchIndex[];
}

interface PlayerSearchIndex {
  id: string;
  name: string;
  teamName?: string;
  teamId?: string;
  hasImage: boolean;
}

interface TeamProcessingResult {
  teamId: string;
  teamName: string;
  processedPlayers: number;
  failedPlayers: number;
  newPlayers: number;
  updatedPlayers: number;
  searchIndex: PlayerSearchIndex[];
}

export class PlayerImageService {
  private readonly ASSETS_DIR = path.join(__dirname, '..', '..', 'assets', 'players');
  private readonly METADATA_FILE = path.join(this.ASSETS_DIR, 'metadata.json');
  private readonly SEARCH_INDEX_FILE = path.join(this.ASSETS_DIR, 'search_index.json');
  private readonly FORMATS = ['avif', 'webp', 'png'] as const;
  private readonly SIZES = {
    small: { width: 48, height: 48 },   // For team player list
    medium: { width: 120, height: 120 } // For player detail page
  };
  private readonly CACHE_DURATION_DAYS = 7; // Refresh player images weekly
  
  private cache: PlayerCache = {
    version: '1.0.0',
    players: {},
    lastUpdated: new Date().toISOString(),
    searchIndex: []
  };

  private apiClient: SwissUnihockeyApiClient;

  constructor() {
    this.apiClient = new SwissUnihockeyApiClient();
    this.initializeCache();
  }

  private async initializeCache() {
    try {
      // Ensure assets directory exists
      await fs.mkdir(this.ASSETS_DIR, { recursive: true });
      
      // Load existing cache
      try {
        const cacheData = await fs.readFile(this.METADATA_FILE, 'utf-8');
        this.cache = { ...this.cache, ...JSON.parse(cacheData) };
        console.log(`📄 Loaded player cache with ${Object.keys(this.cache.players).length} players`);
      } catch (error) {
        console.log('📄 No existing player cache found, starting fresh');
        await this.saveCache();
      }
    } catch (error) {
      console.error('❌ Error initializing player image cache:', error);
    }
  }

  private async saveCache() {
    try {
      this.cache.lastUpdated = new Date().toISOString();
      await fs.writeFile(this.METADATA_FILE, JSON.stringify(this.cache, null, 2));
      
      // Save search index separately for easy access
      await fs.writeFile(this.SEARCH_INDEX_FILE, JSON.stringify(this.cache.searchIndex, null, 2));
    } catch (error) {
      console.error('❌ Error saving player cache:', error);
    }
  }

  // Check if player needs processing
  private needsProcessing(playerId: string): boolean {
    const player = this.cache.players[playerId];
    
    if (!player) return true; // New player
    
    // Check if cache is expired (weekly refresh)
    const lastUpdated = new Date(player.lastUpdated);
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysSinceUpdate >= this.CACHE_DURATION_DAYS;
  }

  // Extract image URL from player detail response
  private extractPlayerImageUrl(playerDetail: any): string | undefined {
    try {
      // Based on what we saw in PlayerDetail.tsx, the image comes from cells[0]?.image?.url
      if (playerDetail?.cells?.[0]?.image?.url) {
        return playerDetail.cells[0].image.url;
      }
      
      // Fallback: check other possible locations
      if (playerDetail?.image?.url) {
        return playerDetail.image.url;
      }
      
      if (playerDetail?.profileImage) {
        return playerDetail.profileImage;
      }
      
      return undefined;
    } catch (error) {
      console.warn('⚠️  Error extracting image URL for player:', error);
      return undefined;
    }
  }

  // Process a single player's image
  async processPlayerImage(playerId: string, playerName: string, imageUrl?: string, teamInfo?: { teamId: string; teamName: string }): Promise<boolean> {
    try {
      console.log(`🖼️  Processing player image: ${playerName} (${playerId})`);
      
      const playerDir = path.join(this.ASSETS_DIR, playerId);
      await fs.mkdir(playerDir, { recursive: true });

      let hasImage = false;
      
      if (imageUrl) {
        try {
          // Download original image
          const response = await fetch(imageUrl);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          
          const imageBuffer = Buffer.from(await response.arrayBuffer());
          
          // Process image in multiple sizes and formats
          for (const [sizeName, dimensions] of Object.entries(this.SIZES)) {
            for (const format of this.FORMATS) {
              const filename = `${playerId}_${sizeName}.${format}`;
              const filepath = path.join(playerDir, filename);
              
              await sharp(imageBuffer)
                .resize(dimensions.width, dimensions.height, {
                  fit: 'cover',
                  position: 'center'
                })
                .toFormat(format as keyof sharp.FormatEnum)
                .toFile(filepath);
            }
          }
          
          hasImage = true;
          console.log(`✅ Successfully processed images for ${playerName}`);
          
        } catch (imageError) {
          console.warn(`⚠️  Failed to process image for ${playerName}:`, imageError);
          hasImage = false;
        }
      }

      // Update metadata
      const metadata: PlayerImageMetadata = {
        playerId,
        playerName,
        originalUrl: imageUrl,
        downloadedAt: hasImage ? new Date().toISOString() : undefined,
        processedAt: hasImage ? new Date().toISOString() : undefined,
        lastUpdated: new Date().toISOString(),
        sizes: this.SIZES,
        formats: this.FORMATS,
        fileSize: {
          small: {},
          medium: {}
        },
        hasImage
      };

      // Calculate file sizes if image was processed
      if (hasImage) {
        for (const [sizeName] of Object.entries(this.SIZES)) {
          for (const format of this.FORMATS) {
            const filepath = path.join(playerDir, `${playerId}_${sizeName}.${format}`);
            try {
              const stats = await fs.stat(filepath);
              metadata.fileSize[sizeName as keyof typeof metadata.fileSize][format] = stats.size;
            } catch (error) {
              // File might not exist, skip
            }
          }
        }
      }

      // Update cache
      this.cache.players[playerId] = metadata;
      
      // Update search index
      this.updateSearchIndex(playerId, playerName, teamInfo);
      
      return hasImage;
    } catch (error) {
      console.error(`❌ Error processing player ${playerName}:`, error);
      return false;
    }
  }

  // Update search index for a player
  private updateSearchIndex(playerId: string, playerName: string, teamInfo?: { teamId: string; teamName: string }) {
    // Remove existing entry
    this.cache.searchIndex = this.cache.searchIndex.filter(p => p.id !== playerId);
    
    // Add updated entry
    this.cache.searchIndex.push({
      id: playerId,
      name: playerName,
      teamName: teamInfo?.teamName,
      teamId: teamInfo?.teamId,
      hasImage: this.cache.players[playerId]?.hasImage || false
    });
  }

  // Process player with API fetch (fetches details and extracts image URL)
  async processPlayerWithApiFetch(playerId: string, playerName: string, teamInfo?: { teamId: string; teamName: string }): Promise<boolean> {
    try {
      console.log(`🔍 Fetching details for player: ${playerName} (${playerId})`);
      
      // Fetch player details to get the image URL
      const playerDetail = await this.apiClient.getPlayerDetails(playerId);
      
      if (!playerDetail) {
        console.warn(`⚠️  No details found for player: ${playerName} (${playerId})`);
        // Still save metadata without image
        return await this.processPlayerImage(playerId, playerName, undefined, teamInfo);
      }
      
      // Extract image URL from the details
      const imageUrl = this.extractPlayerImageUrl(playerDetail);
      
      if (imageUrl) {
        console.log(`📸 Found image URL for ${playerName}: ${imageUrl.substring(0, 50)}...`);
      } else {
        console.log(`📷 No image URL found for ${playerName}`);
      }
      
      // Process the player image with the extracted URL
      return await this.processPlayerImage(playerId, playerName, imageUrl, teamInfo);
      
    } catch (error) {
      console.error(`❌ Error processing player ${playerName} (${playerId}):`, error);
      // Still save metadata without image
      return await this.processPlayerImage(playerId, playerName, undefined, teamInfo);
    }
  }

  // Process all players for a team
  async processTeamPlayers(teamId: string, teamName: string, playersData: Array<{id: string, name: string, imageUrl?: string}>): Promise<TeamProcessingResult> {
    console.log(`🏒 Processing ${playersData.length} players for team ${teamName}`);
    
    let processedPlayers = 0;
    let failedPlayers = 0;
    let newPlayers = 0;
    let updatedPlayers = 0;
    const teamSearchIndex: PlayerSearchIndex[] = [];

    for (const player of playersData) {
      try {
        const wasNew = !this.cache.players[player.id];
        const needsUpdate = this.needsProcessing(player.id);
        
        if (needsUpdate) {
          const success = await this.processPlayerImage(
            player.id, 
            player.name, 
            player.imageUrl,
            { teamId, teamName }
          );
          
          if (success) {
            processedPlayers++;
            if (wasNew) newPlayers++;
            else updatedPlayers++;
          } else {
            failedPlayers++;
          }
        } else {
          // Update team info for existing player
          this.updateSearchIndex(player.id, player.name, { teamId, teamName });
          processedPlayers++;
        }

        // Add to team search index
        teamSearchIndex.push({
          id: player.id,
          name: player.name,
          teamName,
          teamId,
          hasImage: this.cache.players[player.id]?.hasImage || false
        });
        
      } catch (error) {
        console.error(`❌ Error processing player ${player.name}:`, error);
        failedPlayers++;
      }
    }

    // Save updated cache
    await this.saveCache();
    
    const result: TeamProcessingResult = {
      teamId,
      teamName,
      processedPlayers,
      failedPlayers,
      newPlayers,
      updatedPlayers,
      searchIndex: teamSearchIndex
    };

    console.log(`✅ Team ${teamName} processing complete: ${processedPlayers} processed, ${failedPlayers} failed, ${newPlayers} new, ${updatedPlayers} updated`);
    return result;
  }

  // Get player image paths
  getPlayerImagePaths(playerId: string): Record<string, Record<string, string>> | null {
    const player = this.cache.players[playerId];
    if (!player || !player.hasImage) return null;

    const paths: Record<string, Record<string, string>> = {};
    
    for (const sizeName of Object.keys(this.SIZES)) {
      paths[sizeName] = {};
      for (const format of this.FORMATS) {
        paths[sizeName][format] = `/assets/players/${playerId}/${playerId}_${sizeName}.${format}`;
      }
    }
    
    return paths;
  }

  // Get player metadata
  getPlayerMetadata(playerId: string): PlayerImageMetadata | null {
    return this.cache.players[playerId] || null;
  }

  // Get search index
  getSearchIndex(): PlayerSearchIndex[] {
    return this.cache.searchIndex;
  }

  // Search players
  searchPlayers(query: string, limit: number = 20): PlayerSearchIndex[] {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    return this.cache.searchIndex
      .filter(player => 
        player.name.toLowerCase().includes(normalizedQuery) ||
        (player.teamName && player.teamName.toLowerCase().includes(normalizedQuery))
      )
      .slice(0, limit);
  }

  // Get cache statistics
  getCacheStats() {
    const totalPlayers = Object.keys(this.cache.players).length;
    const playersWithImages = Object.values(this.cache.players).filter(p => p.hasImage).length;
    const searchIndexSize = this.cache.searchIndex.length;

    return {
      totalPlayers,
      playersWithImages,
      searchIndexSize,
      lastUpdated: this.cache.lastUpdated,
      version: this.cache.version
    };
  }
}

// Singleton instance
export const playerImageService = new PlayerImageService();