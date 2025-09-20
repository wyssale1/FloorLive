#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import chalk from 'chalk';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const ENTITIES_FILE = path.join(BACKEND_DIR, 'data', 'entities-master.json');

// Swiss Unihockey API configuration
const API_BASE_URL = 'https://api-v2.swissunihockey.ch/api';
const REQUEST_DELAY = 100; // ms between requests to be respectful
const RETRY_ATTEMPTS = 3;
const TTL_DAYS = 7; // TTL for entities in days

// Target leagues to crawl - using same config as frontend Rankings page
const TARGET_LEAGUES = [
  { id: 'nla-men', leagueId: '24', gameClass: '11', leagueName: 'L-UPL', description: 'NLA Men' },
  { id: 'nla-women', leagueId: '24', gameClass: '21', leagueName: 'L-UPL', description: 'NLA Women' },
  { id: 'nlb-men', leagueId: '2', gameClass: '11', leagueName: 'H', description: 'NLB Men' },
  { id: 'nlb-women', leagueId: '2', gameClass: '21', leagueName: 'D', description: 'NLB Women' }
];

class EntityCrawler {
  constructor(options = {}) {
    this.options = {
      dryRun: options.dryRun || false,
      forceRefresh: options.forceRefresh || false,
      teamsOnly: options.teamsOnly || false,
      verbose: options.verbose || false,
      season: options.season || new Date().getFullYear()
    };

    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'User-Agent': 'FloorLive Entity Crawler/1.0.0'
      }
    });

    this.stats = {
      teamsFound: 0,
      teamsAdded: 0,
      teamsUpdated: 0,
      playersFound: 0,
      playersAdded: 0,
      playersUpdated: 0,
      errors: 0
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}]`;

    switch (type) {
      case 'success':
        console.log(chalk.green(`${prefix} ✅ ${message}`));
        break;
      case 'warning':
        console.log(chalk.yellow(`${prefix} ⚠️  ${message}`));
        break;
      case 'error':
        console.log(chalk.red(`${prefix} ❌ ${message}`));
        break;
      case 'info':
        console.log(chalk.blue(`${prefix} ℹ️  ${message}`));
        break;
      case 'verbose':
        if (this.options.verbose) {
          console.log(chalk.gray(`${prefix} 🔍 ${message}`));
        }
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async makeRequest(url, retries = RETRY_ATTEMPTS) {
    try {
      await this.sleep(REQUEST_DELAY);
      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      if (retries > 0) {
        this.log(`Request failed, retrying... (${retries} attempts left)`, 'warning');
        await this.sleep(REQUEST_DELAY * 2);
        return this.makeRequest(url, retries - 1);
      }
      this.stats.errors++;
      throw error;
    }
  }

  async loadExistingEntities() {
    try {
      if (await fs.pathExists(ENTITIES_FILE)) {
        const data = await fs.readJson(ENTITIES_FILE);
        this.log(`Loaded existing entities: ${Object.keys(data.teams || {}).length} teams, ${Object.keys(data.players || {}).length} players`);
        return data;
      }
    } catch (error) {
      this.log(`Error loading existing entities: ${error.message}`, 'warning');
    }

    // Return default structure
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

  needsUpdate(entity) {
    if (this.options.forceRefresh) return true;
    if (!entity || !entity.ttl) return true;

    const ttlDate = new Date(entity.ttl);
    const now = new Date();
    return now > ttlDate;
  }

  createTTL() {
    const ttl = new Date();
    ttl.setDate(ttl.getDate() + TTL_DAYS);
    return ttl.toISOString();
  }

  async fetchLeagueStandings(league) {
    this.log(`Fetching standings for ${league.description}...`, 'verbose');

    try {
      // Temporarily suppress console logs from the API client
      const originalLog = console.log;
      console.log = () => {};

      // Use the backend API client exactly like the frontend does
      const { SwissUnihockeyApiClient } = await import('../backend/dist/services/swissUnihockeyApi.js');
      const api = new SwissUnihockeyApiClient();

      const rankingsData = await api.getRankings({
        season: this.options.season.toString(),
        league: league.leagueId,
        game_class: league.gameClass,
        leagueName: league.leagueName
      });

      // Restore console logging
      console.log = originalLog;

      if (!rankingsData?.standings?.standings) {
        this.log(`No standings data for ${league.description}`, 'warning');
        return [];
      }

      const teams = rankingsData.standings.standings.map(team => ({
        id: team.teamId,
        name: team.teamName,
        logo: team.teamLogo,
        league: {
          name: league.leagueName,
          id: league.leagueId,
          gameClass: league.gameClass
        }
      }));

      this.log(`Found ${teams.length} teams in ${league.description}`, 'verbose');
      return teams;
    } catch (error) {
      this.log(`Error fetching standings for ${league.description}: ${error.message}`, 'error');
      return [];
    }
  }

  async fetchTeamDetails(teamId) {
    this.log(`Fetching details for team ${teamId}...`, 'verbose');

    try {
      // Temporarily suppress console logs from the API client
      const originalLog = console.log;
      console.log = () => {};

      // Use the backend API client for consistency
      const { SwissUnihockeyApiClient } = await import('../backend/dist/services/swissUnihockeyApi.js');
      const api = new SwissUnihockeyApiClient();

      const teamData = await api.getTeamDetails(teamId);

      // Restore console logging
      console.log = originalLog;

      if (!teamData) {
        this.log(`No team details found for ${teamId}`, 'warning');
        return null;
      }

      return {
        id: teamId,
        name: teamData.name || 'Unknown Team',
        logo: teamData.logo,
        website: teamData.website,
        portrait: teamData.portrait,
        league: teamData.league,
        address: teamData.address
      };
    } catch (error) {
      this.log(`Error fetching team details for ${teamId}: ${error.message}`, 'error');
      return null;
    }
  }

  async fetchTeamPlayers(teamId, teamName) {
    if (this.options.teamsOnly) return [];

    this.log(`Fetching players for team ${teamName} (${teamId})...`, 'verbose');

    try {
      // Temporarily suppress console logs from the API client
      const originalLog = console.log;
      console.log = () => {};

      // Use the backend API client for consistency
      const { SwissUnihockeyApiClient } = await import('../backend/dist/services/swissUnihockeyApi.js');
      const api = new SwissUnihockeyApiClient();

      const playersData = await api.getTeamPlayers(teamId);

      // Restore console logging
      console.log = originalLog;

      if (!playersData || !Array.isArray(playersData)) {
        this.log(`No players found for team ${teamName}`, 'verbose');
        return [];
      }

      const players = playersData.map(player => ({
        id: player.id,
        name: player.name,
        number: player.number || '',
        position: player.position || '',
        yearOfBirth: player.yearOfBirth || '',
        goals: player.goals || 0,
        assists: player.assists || 0,
        points: player.points || 0,
        penaltyMinutes: player.penaltyMinutes || 0,
        team: teamName,
        teamId: teamId
      }));

      this.log(`Found ${players.length} players for team ${teamName}`, 'verbose');
      return players;
    } catch (error) {
      // Some teams don't have player data available (not NLA/NLB)
      if (error.response?.status === 400 || error.response?.data?.message?.includes('Not available')) {
        this.log(`Player data not available for team ${teamName}`, 'verbose');
        return [];
      }

      this.log(`Error fetching players for team ${teamName}: ${error.message}`, 'error');
      return [];
    }
  }

  async processTeam(team, entities) {
    this.stats.teamsFound++;

    const existingTeam = entities.teams[team.id];
    const needsUpdate = this.needsUpdate(existingTeam);

    if (!needsUpdate) {
      this.log(`✅ ${team.name} (${team.league.name || 'Unknown'}) - up to date`, 'verbose');
      return;
    }

    // Fetch detailed team information
    const teamDetails = await this.fetchTeamDetails(team.id) || {};

    // Create/update team entity
    const teamEntity = {
      type: 'team',
      id: team.id,
      name: teamDetails.name || team.name,
      logo: teamDetails.logo || team.logo,
      website: teamDetails.website,
      portrait: teamDetails.portrait,
      league: teamDetails.league || team.league,
      address: teamDetails.address,
      lastUpdated: new Date().toISOString(),
      ttl: this.createTTL()
    };

    if (existingTeam) {
      this.stats.teamsUpdated++;
      this.log(`🔄 ${teamEntity.name} (${team.league.name || 'Unknown'})`);
    } else {
      this.stats.teamsAdded++;
      this.log(`➕ ${teamEntity.name} (${team.league.name || 'Unknown'})`);
    }

    entities.teams[team.id] = teamEntity;

    // Fetch team players
    const players = await this.fetchTeamPlayers(team.id, teamEntity.name);

    for (const player of players) {
      this.stats.playersFound++;

      const existingPlayer = entities.players[player.id];
      const playerNeedsUpdate = this.needsUpdate(existingPlayer);

      if (!playerNeedsUpdate) {
        this.log(`  ✅ ${player.name} (#${player.number || '?'}) - up to date`, 'verbose');
        continue;
      }

      const playerEntity = {
        type: 'player',
        id: player.id,
        name: player.name,
        number: player.number,
        position: player.position,
        yearOfBirth: player.yearOfBirth,
        goals: player.goals,
        assists: player.assists,
        points: player.points,
        penaltyMinutes: player.penaltyMinutes,
        team: player.team,
        teamId: player.teamId,
        lastUpdated: new Date().toISOString(),
        ttl: this.createTTL()
      };

      if (existingPlayer) {
        this.stats.playersUpdated++;
        this.log(`  🔄 ${playerEntity.name} (#${playerEntity.number || '?'})`, 'verbose');
      } else {
        this.stats.playersAdded++;
        this.log(`  ➕ ${playerEntity.name} (#${playerEntity.number || '?'})`, 'verbose');
      }

      entities.players[player.id] = playerEntity;
    }
  }

  async saveEntities(entities) {
    if (this.options.dryRun) {
      this.log('Dry run mode - entities not saved', 'info');
      return;
    }

    try {
      // Update metadata
      entities._metadata.lastUpdated = new Date().toISOString();

      // Ensure directory exists
      await fs.ensureDir(path.dirname(ENTITIES_FILE));

      // Save with pretty formatting
      await fs.writeJson(ENTITIES_FILE, entities, { spaces: 2 });

      this.log(`Entities saved to ${ENTITIES_FILE}`, 'success');
    } catch (error) {
      this.log(`Error saving entities: ${error.message}`, 'error');
      throw error;
    }
  }

  printSummary() {
    console.log(chalk.bold('\n📊 Entity Crawler Summary'));
    console.log(chalk.gray('═'.repeat(50)));

    console.log(chalk.blue(`🏒 Teams found: ${this.stats.teamsFound}`));
    console.log(chalk.green(`  ✅ Teams added: ${this.stats.teamsAdded}`));
    console.log(chalk.yellow(`  🔄 Teams updated: ${this.stats.teamsUpdated}`));

    if (!this.options.teamsOnly) {
      console.log(chalk.blue(`👤 Players found: ${this.stats.playersFound}`));
      console.log(chalk.green(`  ✅ Players added: ${this.stats.playersAdded}`));
      console.log(chalk.yellow(`  🔄 Players updated: ${this.stats.playersUpdated}`));
    }

    if (this.stats.errors > 0) {
      console.log(chalk.red(`❌ Errors encountered: ${this.stats.errors}`));
    }

    console.log(chalk.gray('═'.repeat(50)));

    if (this.options.dryRun) {
      console.log(chalk.yellow('🔍 This was a dry run - no changes were saved.'));
      console.log(chalk.gray('Run without --dry-run to apply changes.'));
    } else {
      console.log(chalk.green('✅ Entity crawling completed successfully!'));
      console.log(chalk.gray('You can now run the image processor to generate assets.'));
    }
  }

  async run() {
    console.log(chalk.bold('\n🕷️  Swiss Unihockey Entity Crawler'));
    console.log(chalk.gray('═'.repeat(50)));

    if (this.options.dryRun) {
      console.log(chalk.yellow('🔍 Running in DRY RUN mode - no changes will be saved\n'));
    }

    try {
      // Load existing entities
      const entities = await this.loadExistingEntities();

      // Process each target league directly (same as frontend approach)
      for (const league of TARGET_LEAGUES) {
        this.log(`\n🏒 Processing ${league.description}`);

        const teams = await this.fetchLeagueStandings(league);

        if (teams.length > 0) {
          this.log(`Found ${teams.length} teams`);
          for (const team of teams) {
            await this.processTeam(team, entities);
          }
        } else {
          this.log(`No teams found for ${league.description}`, 'warning');
        }
      }

      // Save updated entities
      await this.saveEntities(entities);

      // Print summary
      this.printSummary();

    } catch (error) {
      this.log(`Crawling failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// CLI setup
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .option('dry-run', {
    type: 'boolean',
    default: false,
    description: 'Preview changes without saving'
  })
  .option('force-refresh', {
    type: 'boolean',
    default: false,
    description: 'Ignore TTL and refresh all entities'
  })
  .option('teams-only', {
    type: 'boolean',
    default: false,
    description: 'Only fetch teams, skip players'
  })
  .option('verbose', {
    type: 'boolean',
    default: false,
    description: 'Enable detailed logging'
  })
  .option('season', {
    type: 'number',
    default: new Date().getFullYear(),
    description: 'Season year to crawl'
  })
  .help()
  .alias('help', 'h')
  .example('$0 --dry-run', 'Preview what would be crawled')
  .example('$0 --teams-only', 'Only crawl teams, skip players')
  .example('$0 --season 2023', 'Crawl specific season')
  .argv;

// Run the crawler
const crawler = new EntityCrawler(argv);
crawler.run().catch(console.error);