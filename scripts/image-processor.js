#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import sharp from 'sharp';
import chalk from 'chalk';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
// Import configuration from local JavaScript file (mirrors frontend TypeScript config)
import { DEFAULT_IMAGE_CONFIG, DEFAULT_SIZE_CONFIGS } from './imageConfig.js';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const ENTITIES_FILE = path.join(BACKEND_DIR, 'data', 'entities-master.json');

// Build image configuration from TypeScript definitions
const IMAGE_CONFIG = {
  version: '2.0.0',
  formats: DEFAULT_IMAGE_CONFIG.formats,
  retina: DEFAULT_IMAGE_CONFIG.retina,
  entities: {
    players: {
      basePath: '/assets/players',
      directoryNaming: 'player-{id}',
      fileNaming: '{id}_{size}{retina}.{format}',
      sizes: {
        small: DEFAULT_SIZE_CONFIGS.small,
        medium: DEFAULT_SIZE_CONFIGS.medium
      }
    },
    teams: {
      basePath: '/assets/teams',
      directoryNaming: 'team-{id}',
      fileNaming: '{size}{retina}.{format}',
      sizes: {
        small: DEFAULT_SIZE_CONFIGS.small,
        medium: DEFAULT_SIZE_CONFIGS.medium
      }
    }
  },
  processing: {
    fit: 'cover',
    position: 'center',
    preventUpscaling: true,
    requestDelayMs: 500
  },
  api: {
    baseUrl: 'https://api-v2.swissunihockey.ch/api',
    timeout: 10000
  }
};

console.log(chalk.blue(`📋 Loaded image configuration v${IMAGE_CONFIG.version} from TypeScript`));

// Extract configuration for easy access
const PLAYER_SIZES = IMAGE_CONFIG.entities.players.sizes;
const LOGO_SIZES = IMAGE_CONFIG.entities.teams.sizes;
const IMAGE_FORMATS = IMAGE_CONFIG.formats.order;
const RETINA_SCALES = IMAGE_CONFIG.retina.scales;
const API_BASE_URL = IMAGE_CONFIG.api.baseUrl;
const REQUEST_DELAY_MS = IMAGE_CONFIG.processing.requestDelayMs;

// Generate directory paths from config
const PLAYERS_DIR = path.join(BACKEND_DIR, IMAGE_CONFIG.entities.players.basePath.replace('/', ''));
const TEAMS_DIR = path.join(BACKEND_DIR, IMAGE_CONFIG.entities.teams.basePath.replace('/', ''));

class ImageProcessor {
  constructor(options = {}) {
    this.options = {
      teamsOnly: options.teamsOnly || false,
      playersOnly: options.playersOnly || false,
      clean: options.clean || false,
      force: options.force || false,
      verbose: options.verbose || false
    };

    this.stats = {
      teamsProcessed: 0,
      playersProcessed: 0,
      teamsFailed: 0,
      playersFailed: 0,
      imagesGenerated: 0
    };
  }

  async run() {
    console.log(chalk.blue.bold('🖼️  FloorLive Image Processor'));
    console.log(chalk.gray('Processing images locally for optimal performance\\n'));

    try {
      // Load entities data
      const entities = await this.loadEntities();

      if (this.options.clean) {
        await this.cleanAssets();
        return;
      }

      // Ensure asset directories exist
      await this.setupDirectories();

      // Process entities
      if (!this.options.playersOnly) {
        await this.processTeams(entities.teams);
      }

      if (!this.options.teamsOnly) {
        await this.processPlayers(entities.players);
      }

      // Print summary
      this.printSummary();

    } catch (error) {
      console.error(chalk.red('❌ Error processing images:'), error.message);
      process.exit(1);
    }
  }

  async loadEntities() {
    if (!await fs.pathExists(ENTITIES_FILE)) {
      throw new Error(`Entities file not found: ${ENTITIES_FILE}`);
    }

    console.log(chalk.blue('📋 Loading entities from entities-master.json...'));
    const entities = await fs.readJson(ENTITIES_FILE);

    const teamCount = Object.keys(entities.teams || {}).length;
    const playerCount = Object.keys(entities.players || {}).length;

    console.log(chalk.green(`✅ Loaded ${teamCount} teams and ${playerCount} players\\n`));

    return entities;
  }

  async setupDirectories() {
    await fs.ensureDir(PLAYERS_DIR);
    await fs.ensureDir(TEAMS_DIR);
    console.log(chalk.blue('📁 Asset directories ready\\n'));
  }

  async cleanAssets() {
    console.log(chalk.yellow('🧹 Cleaning all asset files...'));

    if (await fs.pathExists(PLAYERS_DIR)) {
      await fs.emptyDir(PLAYERS_DIR);
      console.log(chalk.green('✅ Player assets cleaned'));
    }

    if (await fs.pathExists(TEAMS_DIR)) {
      await fs.emptyDir(TEAMS_DIR);
      console.log(chalk.green('✅ Team assets cleaned'));
    }

    console.log(chalk.green.bold('🧹 Asset cleanup complete!'));
  }

  async processTeams(teams) {
    const teamIds = Object.keys(teams);
    if (teamIds.length === 0) {
      console.log(chalk.yellow('⚠️  No teams to process'));
      return;
    }

    console.log(chalk.blue(`🏒 Processing ${teamIds.length} teams...`));

    for (const [index, teamId] of teamIds.entries()) {
      const team = teams[teamId];
      console.log(chalk.gray(`[${index + 1}/${teamIds.length}] Processing team: ${team.name} (${teamId})`));

      try {
        await this.processTeamLogo(teamId, team.name);
        this.stats.teamsProcessed++;
      } catch (error) {
        console.error(chalk.red(`❌ Failed to process team ${team.name}:`), error.message);
        this.stats.teamsFailed++;
      }

      // Rate limiting
      if (index < teamIds.length - 1) {
        await this.delay(REQUEST_DELAY_MS);
      }
    }

    console.log(chalk.green(`✅ Team processing complete: ${this.stats.teamsProcessed} successful, ${this.stats.teamsFailed} failed\\n`));
  }

  async processPlayers(players) {
    const playerIds = Object.keys(players);
    if (playerIds.length === 0) {
      console.log(chalk.yellow('⚠️  No players to process'));
      return;
    }

    console.log(chalk.blue(`👤 Processing ${playerIds.length} players...`));

    for (const [index, playerId] of playerIds.entries()) {
      const player = players[playerId];
      console.log(chalk.gray(`[${index + 1}/${playerIds.length}] Processing player: ${player.name} (${playerId})`));

      try {
        await this.processPlayerImage(playerId, player.name, player.team);
        this.stats.playersProcessed++;
      } catch (error) {
        console.error(chalk.red(`❌ Failed to process player ${player.name}:`), error.message);
        this.stats.playersFailed++;
      }

      // Rate limiting
      if (index < playerIds.length - 1) {
        await this.delay(REQUEST_DELAY_MS);
      }
    }

    console.log(chalk.green(`✅ Player processing complete: ${this.stats.playersProcessed} successful, ${this.stats.playersFailed} failed\\n`));
  }

  async processTeamLogo(teamId, teamName) {
    const logoDir = path.join(TEAMS_DIR, IMAGE_CONFIG.entities.teams.directoryNaming.replace('{id}', teamId));

    // Check if logo already exists (unless force)
    if (!this.options.force && await fs.pathExists(logoDir)) {
      if (this.options.verbose) {
        console.log(chalk.gray(`  ↳ Logo already exists for ${teamName}, skipping`));
      }
      return;
    }

    // Fetch team data to get logo URL
    const teamData = await this.fetchTeamData(teamId);

    // Extract logo URL from Swiss Unihockey API response structure
    let logoUrl = null;
    if (teamData?.data?.regions?.[0]?.rows?.[0]?.cells?.[1]?.image?.url) {
      logoUrl = teamData.data.regions[0].rows[0].cells[1].image.url;
    }

    if (!logoUrl) {
      if (this.options.verbose) {
        console.log(chalk.yellow(`  ↳ No logo available for ${teamName}`));
      }
      return;
    }

    // Download logo
    const logoBuffer = await this.downloadImage(logoUrl);

    // Get source image dimensions to prevent upscaling
    const sourceDimensions = await this.getImageDimensions(logoBuffer);

    // Ensure logo directory exists
    await fs.ensureDir(logoDir);

    // Process logo into different sizes, formats, and retina variants
    for (const [sizeName, sizeConfig] of Object.entries(LOGO_SIZES)) {
      for (const format of IMAGE_FORMATS) {
        for (const scale of sizeConfig.retinaScales) {
          const scaleSuffix = IMAGE_CONFIG.retina.suffixes[scale.toString()];
          const filename = IMAGE_CONFIG.entities.teams.fileNaming
            .replace('{size}', sizeName)
            .replace('{retina}', scaleSuffix)
            .replace('{format}', format);
          const outputPath = path.join(logoDir, filename);

          // Calculate target dimensions
          const targetWidth = sizeConfig.width * scale;
          const targetHeight = sizeConfig.height * scale;

          // Use source dimensions if target would exceed source resolution
          const finalWidth = Math.min(targetWidth, sourceDimensions.width);
          const finalHeight = Math.min(targetHeight, sourceDimensions.height);

          await this.processImage(logoBuffer, outputPath, {
            width: finalWidth,
            height: finalHeight,
            format
          });

          this.stats.imagesGenerated++;
        }
      }
    }

    // Metadata saved per team directory (consistent with players) - removed central metadata.json

    if (this.options.verbose) {
      console.log(chalk.green(`  ↳ Logo processed: ${teamName}`));
    }
  }

  async processPlayerImage(playerId, playerName, teamName) {
    const playerDir = path.join(PLAYERS_DIR, IMAGE_CONFIG.entities.players.directoryNaming.replace('{id}', playerId));

    // Check if player images already exist (unless force)
    if (!this.options.force && await fs.pathExists(playerDir)) {
      if (this.options.verbose) {
        console.log(chalk.gray(`  ↳ Images already exist for ${playerName}, skipping`));
      }
      return;
    }

    // Fetch player data to get image URL
    const playerData = await this.fetchPlayerData(playerId);

    // Extract image URL from Swiss Unihockey API response structure
    let imageUrl = null;
    if (playerData?.data?.regions?.[0]?.rows?.[0]?.cells?.[0]?.image?.url) {
      imageUrl = playerData.data.regions[0].rows[0].cells[0].image.url;
    }

    if (!imageUrl) {
      if (this.options.verbose) {
        console.log(chalk.yellow(`  ↳ No image available for ${playerName}`));
      }
      return;
    }

    // Download player image
    const imageBuffer = await this.downloadImage(imageUrl);

    // Get source image dimensions to prevent upscaling
    const sourceDimensions = await this.getImageDimensions(imageBuffer);

    // Ensure player directory exists
    await fs.ensureDir(playerDir);

    // Process player image into different sizes, formats, and retina variants
    for (const [sizeName, sizeConfig] of Object.entries(PLAYER_SIZES)) {
      for (const format of IMAGE_FORMATS) {
        for (const scale of sizeConfig.retinaScales) {
          const scaleSuffix = IMAGE_CONFIG.retina.suffixes[scale.toString()];
          const filename = IMAGE_CONFIG.entities.players.fileNaming
            .replace('{id}', playerId)
            .replace('{size}', sizeConfig.suffix || sizeName)
            .replace('{retina}', scaleSuffix)
            .replace('{format}', format);
          const outputPath = path.join(playerDir, filename);

          // Calculate target dimensions
          const targetWidth = sizeConfig.width * scale;
          const targetHeight = sizeConfig.height * scale;

          // Use source dimensions if target would exceed source resolution
          const finalWidth = Math.min(targetWidth, sourceDimensions.width);
          const finalHeight = Math.min(targetHeight, sourceDimensions.height);

          await this.processImage(imageBuffer, outputPath, {
            width: finalWidth,
            height: finalHeight,
            format
          });

          this.stats.imagesGenerated++;
        }
      }
    }

    // Save metadata
    await this.savePlayerMetadata(playerId, playerName, teamName, imageUrl, playerDir);

    if (this.options.verbose) {
      console.log(chalk.green(`  ↳ Images processed: ${playerName}`));
    }
  }

  async fetchTeamData(teamId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/teams/${teamId}`, {
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch team data: ${error.message}`);
    }
  }

  async fetchPlayerData(playerId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/players/${playerId}`, {
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch player data: ${error.message}`);
    }
  }

  async downloadImage(imageUrl) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 15000
      });
      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Failed to download image: ${error.message}`);
    }
  }

  async getImageDimensions(imageBuffer) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0
      };
    } catch (error) {
      throw new Error(`Failed to get image dimensions: ${error.message}`);
    }
  }

  async processImage(inputBuffer, outputPath, options) {
    try {
      let processor = sharp(inputBuffer)
        .resize(options.width, options.height, {
          fit: IMAGE_CONFIG.processing.fit,
          position: IMAGE_CONFIG.processing.position
        });

      // Apply format-specific processing using centralized quality settings
      const quality = IMAGE_CONFIG.formats.quality[options.format];
      switch (options.format) {
        case 'avif':
          processor = processor.avif({ quality });
          break;
        case 'webp':
          processor = processor.webp({ quality });
          break;
        case 'png':
          processor = processor.png({ quality });
          break;
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }

      await processor.toFile(outputPath);
    } catch (error) {
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  async savePlayerMetadata(playerId, playerName, teamName, originalUrl, playerDir) {
    const metadataPath = path.join(playerDir, 'metadata.json');

    const metadata = {
      playerId,
      playerName,
      teamName,
      originalUrl,
      processedAt: new Date().toISOString(),
      sizes: PLAYER_SIZES,
      formats: IMAGE_FORMATS,
      retinaScales: RETINA_SCALES,
      hasImage: true
    };

    await fs.writeJson(metadataPath, metadata, { spaces: 2 });
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printSummary() {
    console.log(chalk.blue.bold('📊 Processing Summary:'));
    console.log(chalk.green(`✅ Teams processed: ${this.stats.teamsProcessed}`));
    console.log(chalk.green(`✅ Players processed: ${this.stats.playersProcessed}`));
    console.log(chalk.green(`✅ Images generated: ${this.stats.imagesGenerated}`));

    if (this.stats.teamsFailed > 0) {
      console.log(chalk.red(`❌ Teams failed: ${this.stats.teamsFailed}`));
    }

    if (this.stats.playersFailed > 0) {
      console.log(chalk.red(`❌ Players failed: ${this.stats.playersFailed}`));
    }

    console.log(chalk.blue.bold('\\n🎉 Image processing complete!'));
    console.log(chalk.gray('Assets are ready for deployment via git push.'));
  }
}

// CLI Setup
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .option('teams-only', {
    alias: 't',
    type: 'boolean',
    description: 'Process only team logos'
  })
  .option('players-only', {
    alias: 'p',
    type: 'boolean',
    description: 'Process only player images'
  })
  .option('clean', {
    alias: 'c',
    type: 'boolean',
    description: 'Clean all existing assets'
  })
  .option('force', {
    alias: 'f',
    type: 'boolean',
    description: 'Force reprocess existing images'
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Verbose output'
  })
  .help()
  .alias('help', 'h')
  .argv;

// Run the processor
const processor = new ImageProcessor(argv);
processor.run();