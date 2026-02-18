import axios, { AxiosInstance } from 'axios';
import { SwissUnihockeyApiResponse, GameListParams } from '../types/api.js';
import { Game, GameEvent, Team } from '../types/domain.js';
import { getCurrentSeasonYear } from '../utils/seasonUtils.js';
import { leagueResolver } from './leagueResolver.js';

export class SwissUnihockeyApiClient {
  private client: AxiosInstance;
  private baseURL = 'https://api-v2.swissunihockey.ch/api';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FloorLive/1.0.0'
      }
    });
  }

  async getGames(params: GameListParams = {}): Promise<Game[]> {
    try {
      const response = await this.client.get<any>('/games', {
        params: {
          mode: params.mode || 'current',
          ...params
        }
      });

      return this.mapGamesFromApi(response.data);
    } catch (error) {
      console.error('Error fetching games:', error);
      throw new Error('Failed to fetch games from Swiss Unihockey API');
    }
  }

  async getGamesByDate(date: string): Promise<Game[]> {
    // Convert date to navigate to the right day
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split('T')[0];

    const allGames = await this.getGames({
      mode: 'current',
      before_date: nextDayStr
    });

    // Filter games to only include the exact date requested
    return allGames.filter(game => game.game_date === date);
  }

  async getCurrentGames(): Promise<Game[]> {
    return this.getGames({ mode: 'current' });
  }

  /**
   * Get games for a specific league, game class, and optional group
   * Used for lazy-loading lower tier leagues in the calendar
   */
  async getGamesByLeague(params: {
    date: string;
    league: number;
    gameClass: number;
    group?: string | null;
    season?: number;
  }): Promise<Game[]> {
    try {
      const season = params.season || getCurrentSeasonYear();

      const apiParams: Record<string, any> = {
        mode: 'list',
        season,
        league: params.league,
        game_class: params.gameClass,
        on_date: params.date,
        locale: 'de_CH',
        view: 'full',
      };

      if (params.group) {
        apiParams.group = params.group;
      }

      const response = await this.client.get<any>('/games', { params: apiParams });

      // Map games from API
      const allGames = this.mapGamesFromApi(response.data);

      // IMPORTANT: The API ignores on_date parameter with mode='list'
      // We must filter games by date ourselves
      const targetDate = params.date; // Format: YYYY-MM-DD
      const filteredGames = allGames.filter(game => {
        if (!game.game_date) return false;

        // game.game_date is in format YYYY-MM-DD from mapRowToGame
        return game.game_date === targetDate;
      });

      return filteredGames;
    } catch (error) {
      console.error(`Error fetching games for league ${params.league}:`, error);
      return [];
    }
  }


  async getGameDetails(gameId: string): Promise<Game | null> {
    try {
      const response = await this.client.get<any>(`/games/${gameId}`);
      return await this.mapGameDetailsFromApi(response.data);
    } catch (error) {
      console.error(`Error fetching game ${gameId}:`, error);
      return null;
    }
  }

  async getGameEvents(gameId: string): Promise<GameEvent[]> {
    try {
      // Get game details first to extract home/away team names
      const gameDetails = await this.getGameDetails(gameId);
      if (!gameDetails) {
        console.error(`Could not get game details for ${gameId}`);
        return [];
      }

      return this.getGameEventsOptimized(gameId, gameDetails);
    } catch (error) {
      console.error(`Error fetching events for game ${gameId}:`, error);
      return [];
    }
  }

  async getGameEventsOptimized(gameId: string, gameDetails: any | null): Promise<GameEvent[]> {
    try {
      if (!gameDetails) {
        console.error(`No game details provided for ${gameId}`);
        return [];
      }

      const homeTeamName = gameDetails.home_team?.name || '';
      const awayTeamName = gameDetails.away_team?.name || '';

      // Get game events from Swiss API
      const eventsResponse = await this.client.get<any>(`/game_events/${gameId}`);

      if (!eventsResponse.data) {
        return [];
      }

      // Process events using new mapping function
      const events = this.mapGameEventsFromApi(eventsResponse.data, gameId, homeTeamName, awayTeamName);

      // Return events in their original order (Swiss API returns reverse chronological)
      return events;
    } catch (error) {
      console.error(`Error fetching events for game ${gameId}:`, error);
      return [];
    }
  }

  async getTeamDetails(teamId: string): Promise<any | null> {
    try {
      const response = await this.client.get<any>(`/teams/${teamId}`);
      return await this.mapTeamDetailsFromApi(response.data, teamId);
    } catch (error) {
      console.error(`Error fetching team details for ${teamId}:`, error);
      return null;
    }
  }

  async getTeamPlayers(teamId: string): Promise<any[]> {
    try {
      const response = await this.client.get<any>(`/teams/${teamId}/players`);
      return this.mapTeamPlayersFromApi(response.data);
    } catch (error: any) {
      if (error.response?.data?.message?.includes('Not available for teams that are not in NLA or NLB')) {
        console.log(`Team players only available for NLA/NLB teams. Team ${teamId} is not in NLA/NLB.`);
        return [];
      }
      console.error(`Error fetching team players for ${teamId}:`, error);
      return [];
    }
  }

  async getTeamStatistics(teamId: string): Promise<any | null> {
    // Team statistics endpoints need further investigation
    console.log(`Team statistics endpoints need investigation for team ${teamId}`);
    return null;
  }


  // Swiss Unihockey league name to ID mappings based on actual API structure
  private getGameClassFromLeagueName(leagueName: string): number | null {
    if (!leagueName) return null;

    const leagueLower = leagueName.toLowerCase();

    // Check for women's indicators
    if (leagueLower.includes('damen') || leagueLower.includes('women') || leagueLower.includes('dnlb') || leagueLower.includes('female')) {
      return 21; // Women's game class
    }

    // Check for men's indicators  
    if (leagueLower.includes('herren') || leagueLower.includes('men') || leagueLower.includes('hnlb') || leagueLower.includes('male')) {
      return 11; // Men's game class
    }

    // Default to men's if no clear indication (Swiss Unihockey often defaults to men)
    return 11;
  }

  private getLeagueIdFromName(leagueName: string): number | null {
    const leagueMap: Record<string, number> = {
      // Main leagues from API analysis
      'L-UPL': 24,        // L-UPL (top league)
      'NLB Men': 2,       // NLB Men 
      'NLB Women': 2,     // NLB Women (same league ID, different game_class)
      'NLB': 2,           // Generic NLB
      'HNLB': 2,          // HNLB (Herren NLB)  
      'DNLB': 2,          // DNLB (Damen NLB)
      '1. Liga': 3,
      '2. Liga': 4,
      '3. Liga': 5,
      '4. Liga': 6,
      '5. Liga': 7,
      // Add more mappings as needed
    };

    // Try direct match first
    if (leagueMap[leagueName]) {
      return leagueMap[leagueName];
    }

    // Try partial matches for common patterns
    if (leagueName.includes('L-UPL') || leagueName.includes('UPL')) return 24;
    if (leagueName.includes('NLB') || leagueName.includes('NLA')) return 2; // Both NLA and NLB seem to use league=2
    if (leagueName.includes('1. Liga')) return 3;
    if (leagueName.includes('2. Liga')) return 4;
    if (leagueName.includes('3. Liga')) return 5;
    if (leagueName.includes('4. Liga')) return 6;
    if (leagueName.includes('5. Liga')) return 7;

    return null;
  }

  async getRankings(params: { season?: string; league?: string; game_class?: string; group?: string; leagueName?: string; teamNames?: string[] } = {}): Promise<any | null> {
    try {
      // Note: API ignores parameters, so we fetch all rankings and filter server-side
      const apiParams: Record<string, string | number> = {};

      if (params.season && params.season.trim()) {
        const seasonNum = parseInt(params.season.trim());
        if (!isNaN(seasonNum)) {
          apiParams.season = seasonNum;
        }
      }

      const response = await this.client.get<any>('/rankings', { params: apiParams });

      // Parse all available rankings from the response
      const allRankings = this.parseAvailableRankings(response.data);

      // Apply server-side filtering based on params
      return await this.filterRankings(allRankings, params);
    } catch (error) {
      console.error('Error fetching rankings:', error);
      return null;
    }
  }

  private parseAvailableRankings(apiData: any): any[] {
    if (!apiData?.data?.tabs) return [];

    const rankings: any[] = [];

    for (const tab of apiData.data.tabs) {
      if (!tab.link?.set_in_context) continue;

      const context = tab.link.set_in_context;
      const tabTexts = tab.text || [];

      // Extract league and division info from tab text
      const leagueName = tabTexts[0] || '';
      const divisionName = tabTexts[1] || '';

      rankings.push({
        leagueId: context.league,
        gameClass: context.game_class,
        group: context.group,
        leagueName,
        divisionName,
        fullName: `${leagueName} ${divisionName}`.trim(),
        context: context
      });
    }

    return rankings;
  }

  private async filterRankings(allRankings: any[], params: any): Promise<any> {
    let filteredRankings = allRankings;

    // Filter by league ID
    if (params.league) {
      const leagueId = this.parseLeagueParam(params.league);
      if (leagueId) {
        filteredRankings = filteredRankings.filter(r => r.leagueId === leagueId);
      }
    }

    // Filter by game class
    if (params.game_class) {
      const gameClass = this.parseGameClassParam(params.game_class);
      if (gameClass) {
        filteredRankings = filteredRankings.filter(r => r.gameClass === gameClass);
      }
    }

    // Filter by league name (enhanced with gender detection)
    if (params.leagueName) {
      const leagueNameLower = params.leagueName.toLowerCase();

      // First try exact/partial name matching
      let nameFiltered = filteredRankings.filter(r =>
        r.leagueName.toLowerCase().includes(leagueNameLower) ||
        r.fullName.toLowerCase().includes(leagueNameLower)
      );

      // If we have multiple matches, try to detect gender from league name
      if (nameFiltered.length > 1) {
        // Check for women's indicators in league name
        if (leagueNameLower.includes('damen') ||
          leagueNameLower.includes('women') ||
          leagueNameLower.includes('female') ||
          leagueNameLower.includes('frauen') ||
          leagueNameLower.includes('dnla') ||
          leagueNameLower.includes('dnlb')) {
          const womenFiltered = nameFiltered.filter(r => r.gameClass === 21);
          if (womenFiltered.length > 0) nameFiltered = womenFiltered;
        }
        // Check for men's indicators in league name  
        else if (leagueNameLower.includes('herren') ||
          leagueNameLower.includes('men') ||
          leagueNameLower.includes('male') ||
          leagueNameLower.includes('hnla') ||
          leagueNameLower.includes('hnlb')) {
          const menFiltered = nameFiltered.filter(r => r.gameClass === 11);
          if (menFiltered.length > 0) nameFiltered = menFiltered;
        }
      }

      filteredRankings = nameFiltered;
    }

    // Filter by group
    if (params.group) {
      filteredRankings = filteredRankings.filter(r => r.group === params.group);
    }

    // Additional gender detection using team names (if provided)
    if (filteredRankings.length > 1 && params.teamNames && params.teamNames.length > 0) {
      const teamNamesLower = params.teamNames.map((name: string) => name.toLowerCase());
      const hasWomenIndicators = teamNamesLower.some((name: string) =>
        name.includes('damen') ||
        name.includes('women') ||
        name.includes('ladies') ||
        name.includes('female') ||
        name.includes('frauen')
      );

      if (hasWomenIndicators) {
        const womenFiltered = filteredRankings.filter(r => r.gameClass === 21);
        if (womenFiltered.length > 0) filteredRankings = womenFiltered;
      }
    }

    // If no specific ranking matches, return all available rankings with metadata
    if (filteredRankings.length === 0) {
      return {
        availableRankings: allRankings,
        filteredRankings: [],
        message: 'No rankings match the specified criteria'
      };
    }

    // Fetch the actual standings for the first matching ranking
    const targetRanking = filteredRankings[0];
    const specificRankings = await this.fetchSpecificRankings(params.season || getCurrentSeasonYear().toString(), targetRanking.context);

    return {
      availableRankings: allRankings,
      filteredRankings: filteredRankings,
      requestedRanking: targetRanking,
      standings: specificRankings
    };
  }

  private async fetchSpecificRankings(season: string, context: any): Promise<any | null> {
    try {
      const params: Record<string, string | number> = {
        season: parseInt(season),
        league: context.league,
        game_class: context.game_class
      };

      if (context.group !== null && context.group !== undefined) {
        params.group = context.group;
      }

      const response = await this.client.get<any>('/rankings', { params });
      return this.mapRankingsFromApi(response.data);
    } catch (error) {
      console.error('Error fetching specific rankings:', error);
      return null;
    }
  }

  private parseLeagueParam(league: string): number | null {
    // First try to parse as number
    const leagueNum = parseInt(league);
    if (!isNaN(leagueNum)) {
      return leagueNum;
    }

    // Then try to map from name using existing method
    return this.getLeagueIdFromName(league);
  }

  private parseGameClassParam(gameClass: string): number | null {
    const gameClassNum = parseInt(gameClass);
    if (!isNaN(gameClassNum)) {
      return gameClassNum;
    }

    // Map common names to game class IDs
    const gameClassLower = gameClass.toLowerCase();
    if (gameClassLower.includes('men') || gameClassLower.includes('herren') || gameClassLower.includes('male')) {
      return 11;
    }
    if (gameClassLower.includes('women') || gameClassLower.includes('damen') || gameClassLower.includes('female')) {
      return 21;
    }

    return null;
  }

  async getHeadToHeadGames(gameId: string): Promise<Game[]> {
    try {
      const response = await this.client.get<any>('/games', {
        params: {
          game_id: gameId,
          mode: 'direct'
        }
      });

      return this.mapHeadToHeadGamesFromApi(response.data);
    } catch (error) {
      console.error('Error fetching head-to-head games:', error);
      return [];
    }
  }

  async getTeamGames(teamId: string, season?: string): Promise<Game[]> {
    const seasonYear = season ? parseInt(season) : getCurrentSeasonYear();
    const baseParams = {
      mode: 'team',
      team_id: parseInt(teamId),
      season: seasonYear,
    };

    const allGames: Game[] = [];

    // The Swiss API paginates team games (10 per page).
    // Fetch all pages until we get a 400 or an empty page.
    for (let page = 1; page <= 20; page++) {
      try {
        const response = await this.client.get<any>('/games', {
          params: { ...baseParams, page }
        });
        const games = this.mapTeamGamesFromApi(response.data);
        if (games.length === 0) break;
        allGames.push(...games);
        // If this page had fewer rows than a full page it's the last one
        const rows = response.data?.data?.regions?.[0]?.rows || [];
        if (rows.length < 10) break;
      } catch (error: any) {
        // 400 = no more pages
        if (error?.response?.status === 400) break;
        console.error(`Error fetching team games page ${page}:`, error);
        break;
      }
    }

    return allGames;
  }


  private convertSwissDateToISO(dateStr: string, timeStr: string): string {
    try {
      // Swiss format: DD.MM.YYYY to ISO: YYYY-MM-DD
      const [day, month, year] = dateStr.split('.');
      const time = timeStr || '00:00';
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}:00`;
    } catch {
      return new Date().toISOString();
    }
  }

  private convertSwissDateToISODate(dateStr: string): string {
    try {
      // Check if already in ISO format (YYYY-MM-DD)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }

      // Convert Swiss format (DD.MM.YYYY) to ISO (YYYY-MM-DD)
      if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('.');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      // Fallback: return as-is (e.g., for German words like "heute")
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  private mapHeadToHeadGamesFromApi(apiData: any): Game[] {
    const rows = apiData?.data?.regions?.[0]?.rows || [];
    if (!rows.length) return [];

    return rows.map((row: any, index: number) => {
      const cells = row.cells || [];
      const timeCell = cells[0]?.text?.[0] || '';
      const homeTeamName = cells[1]?.text?.[0] || '';
      const awayTeamName = cells[2]?.text?.[0] || '';
      const scoreCell = cells[3]?.text?.[0] || '';

      // Simple date/time parsing
      const [dateStr, timeStr] = timeCell.split(' ');
      const gameDate = dateStr ? dateStr.split('.').reverse().join('-') : '';

      // Simple score parsing
      const scoreMatch = scoreCell.match(/(\d+)[\s\-:]+(\d+)/);
      const homeScore = scoreMatch ? parseInt(scoreMatch[1]) : null;
      const awayScore = scoreMatch ? parseInt(scoreMatch[2]) : null;

      return {
        id: row.id?.toString() || `h2h-${index}`,
        home_team: {
          id: cells[1]?.link?.ids?.[0]?.toString() || `team-${index}-home`,
          name: homeTeamName,
          short_name: homeTeamName.substring(0, 3).toUpperCase()
        },
        away_team: {
          id: cells[2]?.link?.ids?.[0]?.toString() || `team-${index}-away`,
          name: awayTeamName,
          short_name: awayTeamName.substring(0, 3).toUpperCase()
        },
        home_score: homeScore,
        away_score: awayScore,
        status: scoreMatch ? 'finished' : 'upcoming' as any,
        start_time: timeStr || '',
        game_date: gameDate,
        league: { id: 'unknown', name: 'Unknown League' }
      };
    }).filter((game: Game) => game.home_team.name && game.away_team.name);
  }

  async getTeamCompetitions(teamId: string): Promise<any[]> {
    // Team competitions endpoints need further investigation
    console.log(`Team competitions endpoints need investigation for team ${teamId}`);
    return [];
  }

  async getTeamUpcomingGames(teamId: string): Promise<Game[]> {
    // Redirect to the new getTeamGames method
    console.log(`getTeamUpcomingGames called for team ${teamId}, redirecting to getTeamGames`);
    return this.getTeamGames(teamId);
  }

  private mapGamesFromApi(apiData: any): Game[] {
    const games: Game[] = [];

    if (!apiData?.data?.regions) return games;

    // Get the actual game date from the API context
    const gameDate = apiData?.data?.context?.on_date || new Date().toISOString().split('T')[0];

    apiData.data.regions.forEach((region: any) => {
      const leagueName = region.text || 'Unknown League';

      if (region.rows && Array.isArray(region.rows)) {
        region.rows.forEach((row: any) => {
          try {
            const game = this.mapRowToGame(row, leagueName, gameDate);
            if (game) {
              games.push(game);
            }
          } catch (error) {
            console.warn('Failed to map game row:', error);
          }
        });
      }
    });

    return games;
  }

  private mapRowToGame(row: any, leagueName: string, gameDate: string): Game | null {
    if (!row.cells || !Array.isArray(row.cells) || row.cells.length < 5) {
      return null;
    }

    const cells = row.cells;

    // Detect cell structure variant:
    // mode=current: [time, home_team, separator, away_team, score] (5 cells)
    // mode=list:    [datetime, location, home_team, home_logo, separator, away_logo, away_team, score, ...] (8+ cells)
    const isListMode = cells.length >= 8 && cells[3]?.image;

    let timeCell = '';
    let homeTeamName = '';
    let awayTeamName = '';
    let scoreCell = '';
    let homeTeamId = '';
    let awayTeamId = '';
    let location = '';

    if (isListMode) {
      // mode=list structure: [datetime(0), location(1), home_team(2), home_logo(3), sep(4), away_logo(5), away_team(6), score(7)]
      timeCell = cells[0]?.text?.[0] || '';
      location = cells[1]?.text?.[0] || '';
      homeTeamName = cells[2]?.text?.[0] || '';
      awayTeamName = cells[6]?.text?.[0] || '';
      scoreCell = cells[7]?.text?.[0] || '';

      // Extract team IDs
      if (cells[2]?.link?.ids?.[0]) {
        homeTeamId = cells[2].link.ids[0].toString();
      }
      if (cells[6]?.link?.ids?.[0]) {
        awayTeamId = cells[6].link.ids[0].toString();
      }
    } else {
      // mode=current structure: [time, home_team, separator, away_team, score]
      timeCell = cells[0]?.text?.[0] || '';
      homeTeamName = cells[1]?.text?.[0] || '';
      awayTeamName = cells[3]?.text?.[0] || '';
      scoreCell = cells[4]?.text?.[0] || '';

      // Extract team IDs
      if (cells[1]?.link?.ids?.[0]) {
        homeTeamId = cells[1].link.ids[0].toString();
      }
      if (cells[3]?.link?.ids?.[0]) {
        awayTeamId = cells[3].link.ids[0].toString();
      }
    }

    // Parse score if it exists (e.g., "2:1" or "2 - 1")
    let homeScore = null;
    let awayScore = null;
    let status: 'upcoming' | 'live' | 'finished' = 'upcoming';

    if (scoreCell && scoreCell.trim()) {
      // Check for live score pattern with asterisk (e.g., "2:1*")
      const liveScoreMatch = scoreCell.match(/(\d+)\s*[-:]\s*(\d+)\*/);
      if (liveScoreMatch) {
        homeScore = parseInt(liveScoreMatch[1]);
        awayScore = parseInt(liveScoreMatch[2]);
        status = 'live';
      } else {
        // Regular score pattern without asterisk (e.g., "2:1")
        const scoreMatch = scoreCell.match(/(\d+)\s*[-:]\s*(\d+)/);
        if (scoreMatch) {
          homeScore = parseInt(scoreMatch[1]);
          awayScore = parseInt(scoreMatch[2]);
          status = 'finished';
        }
      }
    }

    // Additional live detection fallbacks
    if (timeCell.toLowerCase().includes('live') ||
      timeCell.includes('Spiel läuft') ||
      scoreCell.toLowerCase().includes('live')) {
      status = 'live';
    }

    // If no team names, return null to skip this game
    if (!homeTeamName || !awayTeamName) {
      return null;
    }

    // If no proper team IDs found, generate consistent IDs from team names
    if (!homeTeamId && homeTeamName) {
      homeTeamId = homeTeamName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }
    if (!awayTeamId && awayTeamName) {
      awayTeamId = awayTeamName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }

    // Extract game ID from the first cell's link if available
    const gameId = cells[0]?.link?.ids?.[0]?.toString() || row.id?.toString() || '';

    // Parse date from timeCell if it contains date info (e.g., "25.01.2026 14:00")
    let parsedGameDate = gameDate;
    let startTime = timeCell;
    const dateTimeMatch = timeCell.match(/(\d{2}\.\d{2}\.\d{4})\s+(\d{2}:\d{2})/);
    if (dateTimeMatch) {
      parsedGameDate = this.convertSwissDateToISODate(dateTimeMatch[1]);
      startTime = dateTimeMatch[2];
    }

    return {
      id: gameId,
      home_team: {
        id: homeTeamId,
        name: homeTeamName,
        short_name: homeTeamName.substring(0, 3).toUpperCase()
      },
      away_team: {
        id: awayTeamId,
        name: awayTeamName,
        short_name: awayTeamName.substring(0, 3).toUpperCase()
      },
      home_score: homeScore,
      away_score: awayScore,
      status,
      start_time: startTime,
      game_date: parsedGameDate,
      league: {
        id: '',
        name: leagueName
      },
      location: location || undefined,
      period: undefined,
      time: status === 'live' ? timeCell : undefined
    };
  }

  private mapGameFromApi(apiGame: any): Game {
    const determineStatus = (game: any): 'upcoming' | 'live' | 'finished' => {
      if (game.live || game.status === 'live') return 'live';
      if (game.result || (game.home_score !== null && game.away_score !== null)) return 'finished';
      return 'upcoming';
    };

    return {
      id: apiGame.id?.toString() || '',
      home_team: this.mapTeamFromApi(apiGame.home_team || apiGame.teams?.home),
      away_team: this.mapTeamFromApi(apiGame.away_team || apiGame.teams?.away),
      home_score: apiGame.home_score ?? apiGame.result?.home ?? null,
      away_score: apiGame.away_score ?? apiGame.result?.away ?? null,
      status: determineStatus(apiGame),
      period: apiGame.period,
      time: apiGame.time || apiGame.game_time,
      start_time: apiGame.start_time || apiGame.time,
      game_date: apiGame.game_date || apiGame.date,
      league: {
        id: apiGame.league?.id?.toString() || '',
        name: apiGame.league?.name || 'Unknown League'
      },
      location: apiGame.location,
      referees: apiGame.referees || []
    };
  }

  private mapTeamFromApi(apiTeam: any): Team {
    if (!apiTeam) {
      return {
        id: '',
        name: 'Unknown Team',
        short_name: 'UNK'
      };
    }

    return {
      id: apiTeam.id?.toString() || '',
      name: apiTeam.name || 'Unknown Team',
      short_name: apiTeam.short_name || apiTeam.name?.substring(0, 3) || 'UNK',
      logo: apiTeam.logo
    };
  }

  private mapEventsFromApi(apiEvents: any, gameId: string): GameEvent[] {
    if (!Array.isArray(apiEvents)) return [];

    return apiEvents.map((event: any) => ({
      id: event.id?.toString() || '',
      game_id: gameId,
      time: event.time || '',
      type: this.mapEventType(event.type),
      player: event.player || '',
      assist: event.assist,
      description: event.description,
      team: event.team === 'home' ? 'home' : 'away'
    }));
  }

  private mapEventType(eventText: string): 'goal' | 'penalty' | 'timeout' | 'other' {
    const text = eventText?.toLowerCase();
    if (text?.includes('torschütze') || text?.includes('goal')) return 'goal';
    if (text?.includes('strafe') || text?.includes('penalty')) return 'penalty';
    if (text?.includes('timeout')) return 'timeout';
    return 'other';
  }

  private extractPlayerName(playerText: string): string {
    if (!playerText) return '';
    // Extract player name before any parentheses (assists)
    const match = playerText.match(/^([^(]+)/);
    return match ? match[1].trim() : playerText.trim();
  }

  private extractAssist(playerText: string): string | undefined {
    if (!playerText) return undefined;
    // Extract assist from parentheses like "Player Name (Assist Name)"
    const match = playerText.match(/\(([^)]+)\)/);
    return match ? match[1].trim() : undefined;
  }

  private parseVenueName(venueName: string): string {
    if (!venueName) return '';

    // Split by spaces and remove duplicate adjacent words
    const words = venueName.split(' ');
    const uniqueWords: string[] = [];

    for (let i = 0; i < words.length; i++) {
      const currentWord = words[i];
      const previousWord = words[i - 1];

      // Only add if it's not the same as the previous word (case-insensitive)
      if (!previousWord || currentWord.toLowerCase() !== previousWord.toLowerCase()) {
        uniqueWords.push(currentWord);
      }
    }

    return uniqueWords.join(' ');
  }

  private parseLeagueName(subtitle: string): string {
    if (!subtitle) return 'Unknown League';

    // Try to extract league code/name from subtitle
    // Common patterns: "Herren GF NLA Playoff...", "Herren GF L-UPL Playoff..."
    const leagueMatch = subtitle.match(/(?:GF\s+)?([A-Z]+-?[A-Z]*[A-Z]+)/);
    if (leagueMatch && leagueMatch[1]) {
      return leagueMatch[1];
    }

    // Fallback: take first meaningful part after "GF" or similar
    const parts = subtitle.split(' ');
    for (const part of parts) {
      if (part.length >= 2 && /^[A-Z]/.test(part) && !['Herren', 'Damen', 'GF', 'Playoff'].includes(part)) {
        return part;
      }
    }

    return subtitle; // Return original if no pattern matches
  }

  private isValidReferee(referee: string): boolean {
    return Boolean(referee && referee.trim() !== '' && referee !== '0' && referee !== 'null' && referee !== 'undefined');
  }

  private async mapGameDetailsFromApi(apiData: any): Promise<Game | null> {
    if (!apiData || !apiData.data?.regions?.[0]?.rows?.[0]) return null;

    try {
      const row = apiData.data.regions[0].rows[0];
      const cells = row.cells;

      if (!cells || !Array.isArray(cells)) return null;

      // Extract data from cells array based on API structure
      const homeTeamName = cells[1]?.text?.[0] || 'Unknown Team';
      const awayTeamName = cells[3]?.text?.[0] || 'Unknown Team';
      const result = cells[4]?.text?.[0] || '';
      const date = cells[5]?.text?.[0] || '';
      const time = cells[6]?.text?.[0] || '';
      const rawLocation = cells[7]?.text?.[0] || '';
      const location = this.parseVenueName(rawLocation);
      const rawFirstReferee = cells[8]?.text?.[0] || '';
      const rawSecondReferee = cells[9]?.text?.[0] || '';
      const firstReferee = this.isValidReferee(rawFirstReferee) ? rawFirstReferee : undefined;
      const secondReferee = this.isValidReferee(rawSecondReferee) ? rawSecondReferee : undefined;
      const spectators = cells[10]?.text?.[0] || '0';

      // Parse coordinates if available in venue data
      let coordinates = undefined;
      if (cells[7]?.coordinates) {
        const coords = cells[7].coordinates;
        if (coords.lng && coords.lat) {
          coordinates = {
            lat: parseFloat(coords.lat),
            lng: parseFloat(coords.lng)
          };
        }
      }

      // Parse venue information
      let venue = undefined;
      if (location) {
        venue = {
          name: location,
          address: cells[7]?.address || undefined
        };
      }

      // Parse result to extract scores
      let homeScore = null;
      let awayScore = null;
      let status: 'upcoming' | 'live' | 'finished' = 'upcoming';

      if (result && result.includes(':')) {
        if (result.includes('*')) {
          // Live game: "0:0*" or "2:1*"
          status = 'live';
          const scoreMatch = result.match(/(\d+):(\d+)/);
          if (scoreMatch) {
            homeScore = parseInt(scoreMatch[1]) || 0;
            awayScore = parseInt(scoreMatch[2]) || 0;
          }
        } else {
          // Finished game: "2:1"
          const scores = result.split(':').map((s: string) => s.trim());
          if (scores.length === 2) {
            homeScore = parseInt(scores[0]) || null;
            awayScore = parseInt(scores[1]) || null;
            status = 'finished';
          }
        }
      } else if (result === '') {
        status = 'upcoming';
      }

      // Extract team IDs from links if available
      const homeTeamId = cells[1]?.link?.ids?.[0]?.toString() || '';
      const awayTeamId = cells[3]?.link?.ids?.[0]?.toString() || '';

      // Extract logo URLs
      const homeLogo = cells[0]?.image?.url || null;
      const awayLogo = cells[2]?.image?.url || null;

      // Resolve league metadata from team IDs
      const leagueName = this.parseLeagueName(apiData.data.subtitle);
      let leagueId = '';
      let gameClass: number | undefined = undefined;
      let group: string | null = null;

      if (homeTeamId || awayTeamId) {
        try {
          const resolvedLeague = await leagueResolver.getCommonLeague(homeTeamId, awayTeamId);
          if (resolvedLeague) {
            leagueId = resolvedLeague.id;
            gameClass = resolvedLeague.gameClass;
            group = resolvedLeague.group ?? null;
          }
        } catch (error) {
          console.warn(`Could not resolve league for game ${homeTeamId} vs ${awayTeamId}:`, error);
        }
      }

      return {
        id: `${homeTeamId}_${awayTeamId}_${date}` || 'unknown',
        home_team: {
          id: homeTeamId,
          name: homeTeamName,
          short_name: homeTeamName,
          logo: homeLogo
        },
        away_team: {
          id: awayTeamId,
          name: awayTeamName,
          short_name: awayTeamName,
          logo: awayLogo
        },
        home_score: homeScore,
        away_score: awayScore,
        status,
        period: undefined,
        time: status === 'upcoming' ? time : null,
        start_time: time,
        game_date: this.convertSwissDateToISODate(date),
        league: {
          id: leagueId,
          name: leagueName,
          gameClass: gameClass,
          group: group
        },
        location,
        venue,
        coordinates,
        referees: {
          first: firstReferee || undefined,
          second: secondReferee || undefined
        },
        spectators: parseInt(spectators) || 0
      };
    } catch (error) {
      console.error('Error mapping game details from API:', error);
      return null;
    }
  }

  // Event classification lookup table - easily extensible
  private readonly EVENT_CLASSIFICATIONS = {
    // Goals
    'Torschütze': { type: 'goal', icon: 'goal', displayAs: 'inline' },

    // Penalties
    "2'-Strafe": { type: 'penalty', icon: 'penalty', displayAs: 'inline' },
    "5'-Strafe": { type: 'penalty', icon: 'penalty', displayAs: 'inline' },
    "10'-Strafe": { type: 'penalty', icon: 'penalty', displayAs: 'inline' },

    // Penalty shots
    'Penalty verschossen': { type: 'penalty_miss', icon: 'no_goal', displayAs: 'inline' },
    'Penalty verwandelt': { type: 'penalty_goal', icon: 'goal', displayAs: 'inline' },

    // Game flow - displayed as badges
    'Spielbeginn': { type: 'game_start', icon: 'whistle', displayAs: 'badge' },
    'Spielende': { type: 'game_end', icon: 'whistle', displayAs: 'badge' },
    'Ende 1. Drittel': { type: 'period_end', icon: 'clock', displayAs: 'badge' },
    'Ende 2. Drittel': { type: 'period_end', icon: 'clock', displayAs: 'badge' },
    'Ende 3. Drittel': { type: 'period_end', icon: 'clock', displayAs: 'badge' },
    'Beginn 1. Drittel': { type: 'period_start', icon: 'clock', displayAs: 'badge' },
    'Beginn 2. Drittel': { type: 'period_start', icon: 'clock', displayAs: 'badge' },
    'Beginn 3. Drittel': { type: 'period_start', icon: 'clock', displayAs: 'badge' },
    'Beginn Verlängerung': { type: 'overtime_start', icon: 'clock', displayAs: 'badge' },
    'Ende Verlängerung': { type: 'overtime_end', icon: 'clock', displayAs: 'badge' },
    'Penaltyschiessen': { type: 'penalty_shootout', icon: 'penalty_shootout', displayAs: 'badge' },

    // Special events
    'Bester Spieler': { type: 'best_player', icon: 'star', displayAs: 'inline' },
    'Timeout': { type: 'timeout', icon: 'pause', displayAs: 'inline' },
    'Auszeit': { type: 'timeout', icon: 'pause', displayAs: 'inline' }
  } as const;

  private mapGameEventsFromApi(apiData: any, gameId: string, homeTeamName: string, awayTeamName: string): GameEvent[] {
    if (!apiData || !Array.isArray(apiData.data?.regions?.[0]?.rows)) {
      return [];
    }

    try {
      const events: GameEvent[] = [];
      const rows = apiData.data.regions[0].rows;

      for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        if (!row.cells || !Array.isArray(row.cells)) continue;

        // Extract raw data from Swiss API structure
        const time = row.cells[0]?.text?.[0] || '';
        const description = row.cells[1]?.text?.[0] || '';
        const teamName = row.cells[2]?.text?.[0] || '';
        const player = row.cells[3]?.text?.[0] || '';

        // Skip empty events
        if (!description.trim()) continue;

        // Classify event type
        const classification = this.classifyEvent(description);

        // Determine team side
        const teamSide = this.determineTeamSide(teamName, homeTeamName, awayTeamName);

        // Parse player and assist
        const { playerName, assist } = this.parsePlayerAndAssist(player);

        const event: GameEvent = {
          id: `${gameId}-${index}`,
          game_id: gameId,
          time,
          description,
          team_name: teamName,
          team_side: teamSide,
          player: playerName,
          assist,
          // Classification metadata
          event_type: classification.type,
          icon: classification.icon,
          display_as: classification.displayAs,
          // Legacy fields for compatibility
          type: this.mapEventTypeForLegacy(description),
          team: teamSide === 'neutral' ? 'home' : teamSide
        };

        events.push(event);
      }

      return events;
    } catch (error) {
      console.error('Error mapping game events from API:', error);
      return [];
    }
  }

  private classifyEvent(description: string): { type: string; icon: string; displayAs: string } {
    // Look for exact matches first
    for (const [key, classification] of Object.entries(this.EVENT_CLASSIFICATIONS)) {
      if (description.includes(key)) {
        return classification;
      }
    }

    // Default classification for unknown events
    return { type: 'other', icon: 'info', displayAs: 'inline' };
  }

  private determineTeamSide(teamName: string, homeTeamName: string, awayTeamName: string): 'home' | 'away' | 'neutral' {
    if (!teamName || teamName.trim() === '') return 'neutral';
    if (teamName === homeTeamName) return 'home';
    if (teamName === awayTeamName) return 'away';
    return 'neutral'; // fallback for unknown team names
  }

  private parsePlayerAndAssist(playerText: string): { playerName: string; assist?: string } {
    if (!playerText || !playerText.trim()) {
      return { playerName: '' };
    }

    // Check if assist is in parentheses: "Player Name (Assistant Name)"
    const assistMatch = playerText.match(/^(.+?)\s*\((.+?)\)$/);
    if (assistMatch) {
      return {
        playerName: assistMatch[1].trim(),
        assist: assistMatch[2].trim()
      };
    }

    return { playerName: playerText.trim() };
  }

  private mapEventTypeForLegacy(description: string): 'goal' | 'penalty' | 'timeout' | 'other' {
    const descLower = description.toLowerCase();
    if (descLower.includes('torschütze') || descLower.includes('goal')) return 'goal';
    if (descLower.includes('strafe') || descLower.includes('penalty')) return 'penalty';
    if (descLower.includes('timeout') || descLower.includes('auszeit')) return 'timeout';
    return 'other';
  }

  private determineGameStatus(apiData: any): 'upcoming' | 'live' | 'finished' {
    if (apiData.status) {
      const status = apiData.status.toLowerCase();
      if (status.includes('live') || status.includes('running')) return 'live';
      if (status.includes('finished') || status.includes('ended')) return 'finished';
    }

    // Fallback: check if there are scores
    if (apiData.home_score !== null && apiData.away_score !== null) {
      return 'finished';
    }

    return 'upcoming';
  }

  private async mapTeamDetailsFromApi(apiData: any, teamId?: string): Promise<any | null> {
    if (!apiData?.data?.regions?.[0]?.rows?.[0]) return null;

    try {
      const row = apiData.data.regions[0].rows[0];
      const cells = row.cells;

      if (!cells || !Array.isArray(cells)) return null;

      // Based on actual API response structure:
      // cells[0] = team name
      // cells[1] = logo
      // cells[2] = website
      // cells[3] = portrait (text)
      // cells[4] = league
      // cells[5] = address

      const leagueName = cells[4]?.text?.[0] || 'Unknown League';
      const actualTeamId = teamId || row.id?.toString() || '';

      // Infer league ID and gameClass from league name
      let leagueId = '';
      const inferredLeagueId = this.getLeagueIdFromName(leagueName);
      if (inferredLeagueId) {
        leagueId = inferredLeagueId.toString();
      }

      const gameClass = this.getGameClassFromLeagueName(leagueName);

      return {
        id: actualTeamId,
        name: cells[0]?.text?.[0] || 'Unknown Team',
        logo: cells[1]?.image?.url || null,
        website: cells[2]?.url?.href || null,
        portrait: cells[3]?.text?.[0] || null,
        league: {
          id: leagueId,
          name: leagueName,
          gameClass: gameClass || undefined,
          group: null
        },
        address: cells[5]?.text || null
      };
    } catch (error) {
      console.error('Error mapping team details:', error);
      return null;
    }
  }

  private mapTeamPlayersFromApi(apiData: any): any[] {
    if (!apiData?.data?.regions?.[0]?.rows) return [];

    try {
      const rows = apiData.data.regions[0].rows;
      const players: any[] = [];

      for (const row of rows) {
        if (!row.cells || !Array.isArray(row.cells)) continue;

        // Based on actual API response structure:
        // cells[0] = number
        // cells[1] = position  
        // cells[2] = name
        // cells[3] = year of birth
        // cells[4] = goals (T)
        // cells[5] = assists (A) 
        // cells[6] = points (P)
        // cells[7] = penalty minutes (SM)

        const player = {
          id: row.cells[2]?.link?.ids?.[0]?.toString() || '',
          number: row.cells[0]?.text?.[0] || '',
          position: row.cells[1]?.text?.[0] || '',
          name: row.cells[2]?.text?.[0] || '',
          yearOfBirth: row.cells[3]?.text?.[0] || '',
          goals: parseInt(row.cells[4]?.text?.[0] || '0') || 0,
          assists: parseInt(row.cells[5]?.text?.[0] || '0') || 0,
          points: parseInt(row.cells[6]?.text?.[0] || '0') || 0,
          penaltyMinutes: parseInt(row.cells[7]?.text?.[0] || '0') || 0
        };

        if (player.name.trim()) {
          players.push(player);
        }
      }

      return players;
    } catch (error) {
      console.error('Error mapping team players:', error);
      return [];
    }
  }

  private mapTeamStatisticsFromApi(apiData: any): any | null {
    if (!apiData?.data?.regions) return null;

    try {
      const statistics = {
        achievements: [] as any[],
        seasons: [] as any[]
      };

      // Process different regions for different types of statistics
      for (const region of apiData.data.regions) {
        if (region.text?.includes('Achievements') || region.text?.includes('Erfolge')) {
          // Process achievements
          if (region.rows && Array.isArray(region.rows)) {
            for (const row of region.rows) {
              if (row.cells && Array.isArray(row.cells)) {
                statistics.achievements.push({
                  season: row.cells[0]?.text?.[0] || '',
                  competition: row.cells[1]?.text?.[0] || '',
                  result: row.cells[2]?.text?.[0] || ''
                });
              }
            }
          }
        } else {
          // Process season statistics
          if (region.rows && Array.isArray(region.rows)) {
            for (const row of region.rows) {
              if (row.cells && Array.isArray(row.cells)) {
                statistics.seasons.push({
                  season: row.cells[0]?.text?.[0] || '',
                  league: row.cells[1]?.text?.[0] || '',
                  position: row.cells[2]?.text?.[0] || '',
                  games: parseInt(row.cells[3]?.text?.[0] || '0') || 0,
                  wins: parseInt(row.cells[4]?.text?.[0] || '0') || 0,
                  losses: parseInt(row.cells[5]?.text?.[0] || '0') || 0,
                  goals: row.cells[6]?.text?.[0] || '0:0'
                });
              }
            }
          }
        }
      }

      return statistics;
    } catch (error) {
      console.error('Error mapping team statistics:', error);
      return null;
    }
  }

  private mapLeagueTableFromApi(apiData: any): any | null {
    if (!apiData?.data?.regions?.[0]?.rows) return null;

    try {
      const rows = apiData.data.regions[0].rows;
      const standings: any[] = [];

      for (const row of rows) {
        if (!row.cells || !Array.isArray(row.cells)) continue;

        const team = {
          position: parseInt(row.cells[0]?.text?.[0] || '0') || 0,
          teamId: row.cells[1]?.link?.ids?.[0]?.toString() || '',
          teamName: row.cells[1]?.text?.[0] || '',
          teamLogo: row.cells[1]?.image?.url || null,
          games: parseInt(row.cells[2]?.text?.[0] || '0') || 0,
          wins: parseInt(row.cells[3]?.text?.[0] || '0') || 0,
          draws: parseInt(row.cells[4]?.text?.[0] || '0') || 0,
          losses: parseInt(row.cells[5]?.text?.[0] || '0') || 0,
          goalsFor: parseInt(row.cells[6]?.text?.[0]?.split(':')?.[0] || '0') || 0,
          goalsAgainst: parseInt(row.cells[6]?.text?.[0]?.split(':')?.[1] || '0') || 0,
          goalDifference: parseInt(row.cells[7]?.text?.[0] || '0') || 0,
          points: parseInt(row.cells[8]?.text?.[0] || '0') || 0
        };

        standings.push(team);
      }

      return {
        leagueId: apiData.data.subtitle_id?.toString() || '',
        leagueName: apiData.data.subtitle || 'Unknown League',
        standings
      };
    } catch (error) {
      console.error('Error mapping league table:', error);
      return null;
    }
  }

  private mapGameStatisticsFromApi(apiData: any): any | null {
    if (!apiData?.data?.regions) return null;

    try {
      const statistics = {
        gameStats: {} as any,
        playerStats: {
          home: [] as any[],
          away: [] as any[]
        },
        teamStats: {
          home: {} as any,
          away: {} as any
        }
      };

      // Process different regions for different types of statistics
      for (const region of apiData.data.regions) {
        if (region.text?.toLowerCase().includes('spielstatistik') || region.text?.toLowerCase().includes('game statistics')) {
          // Process game statistics
          if (region.rows && Array.isArray(region.rows)) {
            for (const row of region.rows) {
              if (row.cells && Array.isArray(row.cells)) {
                const statName = row.cells[0]?.text?.[0] || '';
                const homeValue = row.cells[1]?.text?.[0] || '0';
                const awayValue = row.cells[2]?.text?.[0] || '0';

                statistics.teamStats.home[statName] = homeValue;
                statistics.teamStats.away[statName] = awayValue;
              }
            }
          }
        } else if (region.text?.toLowerCase().includes('spieler') || region.text?.toLowerCase().includes('player')) {
          // Process player statistics
          if (region.rows && Array.isArray(region.rows)) {
            for (const row of region.rows) {
              if (row.cells && Array.isArray(row.cells)) {
                const player = {
                  number: row.cells[0]?.text?.[0] || '',
                  name: row.cells[1]?.text?.[0] || '',
                  goals: parseInt(row.cells[2]?.text?.[0] || '0') || 0,
                  assists: parseInt(row.cells[3]?.text?.[0] || '0') || 0,
                  penalties: parseInt(row.cells[4]?.text?.[0] || '0') || 0,
                  playingTime: row.cells[5]?.text?.[0] || '0:00'
                };

                // Determine team based on some logic (this might need adjustment based on actual API structure)
                const team = region.text?.toLowerCase().includes('home') ? 'home' : 'away';
                statistics.playerStats[team as 'home' | 'away'].push(player);
              }
            }
          }
        }
      }

      return statistics;
    } catch (error) {
      console.error('Error mapping game statistics:', error);
      return null;
    }
  }

  private mapTeamCompetitionsFromApi(apiData: any): any[] {
    if (!apiData?.data?.regions?.[0]?.rows) return [];

    try {
      const rows = apiData.data.regions[0].rows;
      const competitions: any[] = [];

      for (const row of rows) {
        if (!row.cells || !Array.isArray(row.cells)) continue;

        const competition = {
          id: row.id?.toString() || '',
          name: row.cells[0]?.text?.[0] || '',
          season: row.cells[1]?.text?.[0] || '',
          division: row.cells[2]?.text?.[0] || '',
          status: row.cells[3]?.text?.[0] || '',
          position: row.cells[4]?.text?.[0] || '',
          games: parseInt(row.cells[5]?.text?.[0] || '0') || 0,
          points: parseInt(row.cells[6]?.text?.[0] || '0') || 0
        };

        if (competition.name.trim()) {
          competitions.push(competition);
        }
      }

      return competitions;
    } catch (error) {
      console.error('Error mapping team competitions:', error);
      return [];
    }
  }

  private mapTeamGamesFromApi(apiData: any): Game[] {
    if (!apiData?.data?.regions?.[0]?.rows) return [];

    try {
      const rows = apiData.data.regions[0].rows;
      const games: Game[] = [];

      for (const row of rows) {
        if (!row.cells || !Array.isArray(row.cells)) continue;

        // Actual Swiss API structure for mode=team:
        // cells[0]: date (text[0]) + time (text[1])
        // cells[1]: venue (text[0]) with map link
        // cells[2]: home team name (no link on team cells)
        // cells[3]: away team name
        // cells[4]: score (e.g. "3:5") – present only for finished games
        // row.link: { type:'web', page:'game_detail', ids:[gameId] }
        const date = row.cells[0]?.text?.[0] || '';
        const time = row.cells[0]?.text?.[1] || '';
        const venue = row.cells[1]?.text?.[0] || '';
        const homeTeam = row.cells[2]?.text?.[0] || '';
        const awayTeam = row.cells[3]?.text?.[0] || '';
        const scoreRaw = row.cells[4]?.text?.[0] || '';

        // Game ID lives on the row link, not row.id
        const gameId = row.link?.ids?.[0]?.toString() || '';

        // Determine status from score presence
        const scoreMatch = scoreRaw.match(/^(\d+):(\d+)/);
        const homeScore = scoreMatch ? parseInt(scoreMatch[1]) : null;
        const awayScore = scoreMatch ? parseInt(scoreMatch[2]) : null;
        const status = scoreMatch ? 'finished' : 'upcoming';

        if (!homeTeam && !awayTeam) continue;

        const game: Game = {
          id: gameId,
          home_team: {
            id: '',   // not available in this endpoint
            name: homeTeam,
            short_name: homeTeam.substring(0, 3).toUpperCase()
          },
          away_team: {
            id: '',   // not available in this endpoint
            name: awayTeam,
            short_name: awayTeam.substring(0, 3).toUpperCase()
          },
          home_score: homeScore,
          away_score: awayScore,
          status: status as any,
          start_time: time,
          game_date: date,
          league: {
            id: '',
            name: apiData.data.subtitle || 'Unknown League'
          },
          location: venue,
          period: undefined,
          time: undefined
        };

        games.push(game);
      }

      return games;
    } catch (error) {
      console.error('Error mapping team games:', error);
      return [];
    }
  }

  private findTeamFromGames(teamId: string, games: Game[]): Team | null {
    for (const game of games) {
      if (game.home_team.id === teamId) {
        return game.home_team;
      }
      if (game.away_team.id === teamId) {
        return game.away_team;
      }
    }
    return null;
  }

  private mapRankingsFromApi(apiData: any): any | null {
    if (!apiData?.data?.regions?.[0]?.rows) return null;

    try {
      const rows = apiData.data.regions[0].rows;
      const standings: any[] = [];

      for (const row of rows) {
        if (!row.cells || !Array.isArray(row.cells)) continue;

        // Correct Swiss Unihockey API structure (confirmed via debug logging):
        // cells[0] = position/rank
        // cells[1] = team logo (image only)
        // cells[2] = team name (text)
        // cells[3] = GP (Games Played) ✓
        // cells[4] = Unknown (possibly OT wins or draws)
        // cells[5] = W (Wins) ✓
        // cells[6] = Unknown (possibly OT wins)
        // cells[7] = Unknown (possibly OT losses)
        // cells[8] = Unknown (possibly regulation losses)
        // cells[9] = goals (format like "24:8") ✓
        // cells[10] = goal difference (format like "+16") ✓
        // cells[11] = Unknown (possibly points per game average)
        // cells[12] = points (total) ✓

        const goalsText = row.cells[9]?.text?.[0] || '0:0';
        const [goalsFor, goalsAgainst] = goalsText.split(':').map((g: string) => parseInt(g.trim()) || 0);
        const goalDiffText = row.cells[10]?.text?.[0] || '0';
        const goalDifference = parseInt(goalDiffText.replace('+', '')) || 0;

        // Read values directly from correct cell positions
        const games = parseInt(row.cells[3]?.text?.[0] || '0') || 0;  // GP is in cell[3]
        const wins = parseInt(row.cells[5]?.text?.[0] || '0') || 0;   // Wins in cell[5]

        // For draws and losses, we need to determine from remaining cells
        // Swiss Unihockey typically has: W, OTW, OTL, L columns
        // Without full confirmation, calculate losses as games - wins
        const draws = 0; // Swiss Unihockey doesn't use draws in modern format
        const losses = Math.max(0, games - wins); // Calculate remaining games as losses

        const team = {
          position: parseInt(row.cells[0]?.text?.[0] || '0') || 0,
          teamId: row.cells[2]?.link?.ids?.[0]?.toString() || row.cells[1]?.link?.ids?.[0]?.toString() || '',
          teamName: row.cells[2]?.text?.[0] || '',
          teamLogo: row.cells[1]?.image?.url || null,
          games,
          wins,
          draws,
          losses,
          goalsFor,
          goalsAgainst,
          goalDifference,
          points: parseInt(row.cells[12]?.text?.[0] || '0') || 0
        };

        standings.push(team);
      }

      return {
        leagueId: apiData.data.context?.league || '',
        leagueName: apiData.data.title || 'Unknown League',
        season: apiData.data.context?.season || '',
        standings
      };
    } catch (error) {
      console.error('Error mapping rankings from API:', error);
      return null;
    }
  }

  // Player API methods
  async getPlayerDetails(playerId: string): Promise<any | null> {
    try {
      const response = await this.client.get<any>(`/players/${playerId}`);
      return this.mapPlayerDetailsFromApi(response.data);
    } catch (error) {
      console.error(`Error fetching player details for ${playerId}:`, error);
      return null;
    }
  }

  async getPlayerStatistics(playerId: string): Promise<any[]> {
    try {
      const response = await this.client.get<any>(`/players/${playerId}/statistics`);
      return this.mapPlayerStatisticsFromApi(response.data);
    } catch (error) {
      console.error(`Error fetching player statistics for ${playerId}:`, error);
      return [];
    }
  }

  async getPlayerOverview(playerId: string): Promise<any[]> {
    try {
      const response = await this.client.get<any>(`/players/${playerId}/overview`);
      return this.mapPlayerOverviewFromApi(response.data);
    } catch (error) {
      console.error(`Error fetching player overview for ${playerId}:`, error);
      return [];
    }
  }

  private mapPlayerDetailsFromApi(apiData: any): any | null {
    if (!apiData?.data) return null;

    try {
      const data = apiData.data;

      // Extract player information from the API response
      // Handle the complex nested structure shown in the API example
      // Parse the regions[0].rows[0].cells structure first to get image
      const mainRow = data.regions?.[0]?.rows?.[0];
      const cells = mainRow?.cells || [];

      // Extract profile image from cells[0].image.url (portrait is the first cell)
      const profileImage = cells[0]?.image?.url || null;

      // Get the main player info from subtitle (player name)
      const playerName = data.subtitle || data.title || '';

      // Use the already extracted cells from above

      const playerInfo: any = {
        id: data.context?.player_id || '',
        name: playerName,
        profile_image: profileImage
      };

      // Map cells based on the API structure we observed:
      // cells[0] = portrait image
      // cells[1] = club/team
      // cells[2] = number/jersey  
      // cells[3] = position
      // cells[4] = year of birth
      // cells[5] = height
      // cells[6] = weight
      // cells[7] = license type

      if (cells.length > 1 && cells[1]?.text?.[0]) {
        const clubName = cells[1].text[0];
        playerInfo.club = {
          id: cells[1]?.link?.ids?.[0] || '',
          name: clubName,
          logo: cells[1]?.image?.url || null
        };

        // Set current season info
        playerInfo.currentSeason = {
          league: cells[7]?.text?.[0] || 'Unknown League',
          team: clubName,
          jerseyNumber: cells[2]?.text?.[0] || undefined
        };
      }

      // Extract other fields from their respective cells
      if (cells[2]?.text?.[0]) playerInfo.number = cells[2].text[0];
      if (cells[3]?.text?.[0]) playerInfo.position = cells[3].text[0];

      // Parse year of birth
      if (cells[4]?.text?.[0]) {
        const yearText = cells[4].text[0];
        const yearMatch = yearText.match(/(\d{4})/);
        if (yearMatch) {
          playerInfo.yearOfBirth = parseInt(yearMatch[1]);
        }
      }

      // Height and weight handling
      if (cells[5]?.text?.[0] && cells[5].text[0] !== '-') {
        playerInfo.height = cells[5].text[0];
      }
      if (cells[6]?.text?.[0] && cells[6].text[0] !== '-') {
        playerInfo.weight = cells[6].text[0];
      }

      // License type
      if (cells[7]?.text?.[0]) {
        playerInfo.licenseType = cells[7].text[0];
      }

      // Try to extract additional info from headers if available
      const headers = data.headers || [];
      const headerMap: Record<string, number> = {};
      headers.forEach((header: any, index: number) => {
        if (header.key) {
          headerMap[header.key.toLowerCase()] = index;
        }
      });

      // Use header mapping for more precise field extraction if available
      Object.entries(headerMap).forEach(([key, cellIndex]) => {
        const cellValue = cells[cellIndex]?.text?.[0];
        if (!cellValue || cellValue === '-') return;

        switch (key) {
          case 'nationality':
          case 'nationalität':
            playerInfo.nationality = cellValue;
            break;
          case 'birthplace':
          case 'geburtsort':
            playerInfo.birthPlace = cellValue;
            break;
          case 'shoots':
          case 'schießt':
            if (cellValue.toLowerCase().includes('left') || cellValue.toLowerCase().includes('links')) {
              playerInfo.shoots = 'L';
            } else if (cellValue.toLowerCase().includes('right') || cellValue.toLowerCase().includes('rechts')) {
              playerInfo.shoots = 'R';
            }
            break;
        }
      });

      return playerInfo;
    } catch (error) {
      console.error('Error mapping player details:', error);
      return null;
    }
  }

  private mapPlayerStatisticsFromApi(apiData: any): any[] {
    if (!apiData?.data?.regions?.[0]?.rows) return [];

    try {
      const rows = apiData.data.regions[0].rows;
      const statistics: any[] = [];

      for (const row of rows) {
        if (!row.cells || !Array.isArray(row.cells)) continue;

        // Common statistics structure:
        // cells[0] = season
        // cells[1] = league  
        // cells[2] = team
        // cells[3] = games played
        // cells[4] = goals
        // cells[5] = assists
        // cells[6] = points
        // cells[7+] = penalty details (2min, 5min, 10min, match penalties)

        const stat = {
          season: row.cells[0]?.text?.[0] || '',
          league: row.cells[1]?.text?.[0] || '',
          team: row.cells[2]?.text?.[0] || '',
          teamId: row.cells[2]?.link?.ids?.[0]?.toString() || '',
          games: parseInt(row.cells[3]?.text?.[0] || '0') || 0,
          goals: parseInt(row.cells[4]?.text?.[0] || '0') || 0,
          assists: parseInt(row.cells[5]?.text?.[0] || '0') || 0,
          points: parseInt(row.cells[6]?.text?.[0] || '0') || 0,
          penalties: {
            two_minute: parseInt(row.cells[7]?.text?.[0] || '0') || 0,
            five_minute: parseInt(row.cells[8]?.text?.[0] || '0') || 0,
            ten_minute: parseInt(row.cells[9]?.text?.[0] || '0') || 0,
            match_penalty: parseInt(row.cells[10]?.text?.[0] || '0') || 0
          }
        };

        statistics.push(stat);
      }

      return statistics;
    } catch (error) {
      console.error('Error mapping player statistics:', error);
      return [];
    }
  }

  private mapPlayerOverviewFromApi(apiData: any): any[] {
    if (!apiData?.data?.regions?.[0]?.rows) return [];

    try {
      const rows = apiData.data.regions[0].rows;
      const overview: any[] = [];

      for (const row of rows) {
        if (!row.cells || !Array.isArray(row.cells)) continue;

        // Common overview structure:
        // cells[0] = game date
        // cells[1] = venue/location
        // cells[2] = game time
        // cells[3] = home team
        // cells[4] = away team  
        // cells[5] = game score
        // cells[6] = player goals
        // cells[7] = player assists
        // cells[8] = player points
        // cells[9] = match penalties

        const game = {
          gameDate: row.cells[0]?.text?.[0] || '',
          venue: row.cells[1]?.text?.[0] || '',
          gameTime: row.cells[2]?.text?.[0] || '',
          homeTeam: row.cells[3]?.text?.[0] || '',
          homeTeamId: row.cells[3]?.link?.ids?.[0]?.toString() || '',
          awayTeam: row.cells[4]?.text?.[0] || '',
          awayTeamId: row.cells[4]?.link?.ids?.[0]?.toString() || '',
          gameScore: row.cells[5]?.text?.[0] || '',
          playerGoals: parseInt(row.cells[6]?.text?.[0] || '0') || 0,
          playerAssists: parseInt(row.cells[7]?.text?.[0] || '0') || 0,
          playerPoints: parseInt(row.cells[8]?.text?.[0] || '0') || 0,
          matchPenalties: parseInt(row.cells[9]?.text?.[0] || '0') || 0
        };

        overview.push(game);
      }

      return overview;
    } catch (error) {
      console.error('Error mapping player overview:', error);
      return [];
    }
  }
}