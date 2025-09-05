import axios, { AxiosInstance } from 'axios';
import { Game, GameEvent, SwissUnihockeyApiResponse, GameListParams, Team } from '../types/api.js';

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

  async getGameDetails(gameId: string): Promise<Game | null> {
    try {
      const response = await this.client.get<any>(`/games/${gameId}`);
      return this.mapGameDetailsFromApi(response.data);
    } catch (error) {
      console.error(`Error fetching game ${gameId}:`, error);
      return null;
    }
  }

  async getGameEvents(gameId: string): Promise<GameEvent[]> {
    try {
      // Make 3 parallel API calls for complete event data
      const [generalResponse, homeResponse, awayResponse] = await Promise.all([
        this.client.get<any>(`/game_events/${gameId}`).catch(() => ({ data: null })),
        this.client.get<any>(`/game_events/${gameId}?team=home`).catch(() => ({ data: null })),
        this.client.get<any>(`/game_events/${gameId}?team=away`).catch(() => ({ data: null }))
      ]);

      // Process home and away events first (these have correct team labels)
      const homeEvents = homeResponse.data ? 
        this.mapGameEventsFromApiWithTeam(homeResponse.data, gameId, 'home') : [];
      const awayEvents = awayResponse.data ? 
        this.mapGameEventsFromApiWithTeam(awayResponse.data, gameId, 'away') : [];

      // Process general events, but exclude duplicates already in home/away
      const generalEvents = generalResponse.data ? 
        this.mapGameEventsFromApiWithTeam(generalResponse.data, gameId, 'general') : [];
      const filteredGeneralEvents = this.filterDuplicateEvents(generalEvents, [...homeEvents, ...awayEvents]);

      // Merge all unique events
      const allEvents = [...homeEvents, ...awayEvents, ...filteredGeneralEvents];

      // Sort by time
      return this.sortEventsByTime(allEvents);
    } catch (error) {
      console.error(`Error fetching events for game ${gameId}:`, error);
      return [];
    }
  }

  async getTeamDetails(teamId: string): Promise<any | null> {
    try {
      const response = await this.client.get<any>(`/teams/${teamId}`);
      return this.mapTeamDetailsFromApi(response.data);
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

  async getLeagueTable(leagueId: string): Promise<any | null> {
    // League table endpoints don't exist in the Swiss Unihockey API
    console.log(`League table endpoints are not available in the Swiss Unihockey API for league ${leagueId}`);
    return null;
  }

  async getRankings(params: { season?: string; league?: string; game_class?: string; group?: string } = {}): Promise<any | null> {
    try {
      const response = await this.client.get<any>('/rankings', { params });
      return this.mapRankingsFromApi(response.data);
    } catch (error) {
      console.error('Error fetching rankings:', error);
      return null;
    }
  }

  async getGameStatistics(gameId: string): Promise<any | null> {
    try {
      // For now, return null since statistics endpoints require authentication
      console.log(`Game statistics endpoint for ${gameId} requires API authentication`);
      return null;
    } catch (error) {
      console.error(`Error fetching game statistics for ${gameId}:`, error);
      return null;
    }
  }

  async getTeamCompetitions(teamId: string): Promise<any[]> {
    // Team competitions endpoints need further investigation
    console.log(`Team competitions endpoints need investigation for team ${teamId}`);
    return [];
  }

  async getTeamUpcomingGames(teamId: string): Promise<Game[]> {
    // Team upcoming games endpoints need further investigation
    console.log(`Team upcoming games endpoints need investigation for team ${teamId}`);
    return [];
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

    // Parse cells: [time, home_team, separator, away_team, score]
    const timeCell = row.cells[0]?.text?.[0] || '';
    const homeTeamName = row.cells[1]?.text?.[0] || '';
    const awayTeamName = row.cells[3]?.text?.[0] || '';
    const scoreCell = row.cells[4]?.text?.[0] || '';

    // Parse score if it exists (e.g., "2:1" or "2 - 1")
    let homeScore = null;
    let awayScore = null;
    let status: 'upcoming' | 'live' | 'finished' = 'upcoming';

    if (scoreCell && scoreCell.trim()) {
      const scoreMatch = scoreCell.match(/(\d+)\s*[-:]\s*(\d+)/);
      if (scoreMatch) {
        homeScore = parseInt(scoreMatch[1]);
        awayScore = parseInt(scoreMatch[2]);
        status = 'finished';
      }
    }

    // Check if game is live (this might be indicated differently in the API)
    if (timeCell.toLowerCase().includes('live') || scoreCell.toLowerCase().includes('live')) {
      status = 'live';
    }

    // Extract team IDs from links if available 
    // Note: Use different extraction approach than mapGameDetailsFromApi since data structure might differ
    let homeTeamId = '';
    let awayTeamId = '';
    
    // Try to extract team IDs from multiple possible locations
    if (row.cells[1]?.link?.ids?.[0]) {
      homeTeamId = row.cells[1].link.ids[0].toString();
    } else if (row.cells[1]?.href) {
      // Extract ID from href if available (e.g., "/teams/12345")
      const match = row.cells[1].href.match(/\/teams\/(\d+)/);
      if (match) homeTeamId = match[1];
    }
    
    if (row.cells[3]?.link?.ids?.[0]) {
      awayTeamId = row.cells[3].link.ids[0].toString();
    } else if (row.cells[3]?.href) {
      // Extract ID from href if available (e.g., "/teams/12345")
      const match = row.cells[3].href.match(/\/teams\/(\d+)/);
      if (match) awayTeamId = match[1];
    }
    
    // If no proper team IDs found, generate consistent IDs from team names
    if (!homeTeamId && homeTeamName) {
      homeTeamId = homeTeamName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }
    if (!awayTeamId && awayTeamName) {
      awayTeamId = awayTeamName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }

    return {
      id: row.id?.toString() || '',
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
      start_time: timeCell,
      game_date: gameDate,
      league: {
        id: '',
        name: leagueName
      },
      location: undefined,
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

  private mapGameDetailsFromApi(apiData: any): Game | null {
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
      const location = cells[7]?.text?.[0] || '';
      const firstReferee = cells[8]?.text?.[0] || '';
      const secondReferee = cells[9]?.text?.[0] || '';
      const spectators = cells[10]?.text?.[0] || '0';

      // Parse result to extract scores
      let homeScore = null;
      let awayScore = null;
      let status: 'upcoming' | 'live' | 'finished' = 'upcoming';


      if (result && result.includes(':')) {
        const scores = result.split(':').map((s: string) => s.trim());
        if (scores.length === 2) {
          homeScore = parseInt(scores[0]) || null;
          awayScore = parseInt(scores[1]) || null;
          status = 'finished';
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
        game_date: date,
        league: {
          id: '',
          name: apiData.data.subtitle || 'Unknown League'
        },
        location,
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

  private mapGameEventsFromApiWithTeam(apiData: any, gameId: string, teamType: 'home' | 'away' | 'general'): GameEvent[] {
    if (!apiData || !Array.isArray(apiData.data?.regions?.[0]?.rows)) {
      return [];
    }

    try {
      const events: GameEvent[] = [];
      const rows = apiData.data.regions[0].rows;

      for (const row of rows) {
        if (!row.cells || !Array.isArray(row.cells)) continue;

        const time = row.cells[0]?.text?.[0] || '';
        const eventText = row.cells[1]?.text?.[0] || '';
        const team = row.cells[2]?.text?.[0] || '';
        const player = row.cells[3]?.text?.[0] || '';

        // Skip empty events
        if (!eventText.trim()) continue;

        // Assign team based on API call type, with fallback for general events
        let assignedTeam: 'home' | 'away';
        if (teamType === 'home') {
          assignedTeam = 'home';
        } else if (teamType === 'away') {
          assignedTeam = 'away';
        } else {
          // For general events (remaining after deduplication), use intelligent assignment
          assignedTeam = this.determineEventTeam(eventText, player, team);
        }

        const event: GameEvent = {
          id: `${gameId}-${teamType}-${events.length}`,
          game_id: gameId,
          time,
          type: this.mapEventType(eventText),
          player: this.extractPlayerName(player),
          assist: this.extractAssist(player),
          description: eventText,
          team: assignedTeam
        };

        events.push(event);
      }

      return events;
    } catch (error) {
      console.error('Error mapping game events from API:', error);
      return [];
    }
  }

  private filterDuplicateEvents(generalEvents: GameEvent[], homeAwayEvents: GameEvent[]): GameEvent[] {
    // Create set of home/away event keys
    const homeAwayKeys = new Set(
      homeAwayEvents.map(event => `${event.time}-${event.description}`)
    );

    // Filter general events to exclude those already in home/away
    return generalEvents.filter(event => {
      const key = `${event.time}-${event.description}`;
      return !homeAwayKeys.has(key);
    });
  }

  private sortEventsByTime(events: GameEvent[]): GameEvent[] {
    return events.sort((a, b) => {
      // Parse time format like "46:32" to minutes for sorting
      const parseTime = (timeStr: string) => {
        if (!timeStr) return 0;
        const parts = timeStr.split(':');
        if (parts.length !== 2) return 0;
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
      };
      
      const timeA = parseTime(a.time);
      const timeB = parseTime(b.time);
      
      return timeA - timeB;
    });
  }

  private determineEventTeam(eventText: string, player: string, team: string): 'home' | 'away' {
    // Period events, timeouts, and other neutral events should alternate or be treated as neutral
    const neutralEvents = [
      'ende', 'beginn', 'drittel', 'beendet', 'spielbeginn', 'spielende',
      'timeout', 'bester spieler', 'auszeit'
    ];
    
    const eventLower = eventText.toLowerCase();
    const isNeutralEvent = neutralEvents.some(neutral => eventLower.includes(neutral));
    
    if (isNeutralEvent) {
      // For neutral events, use a simple alternation based on event hash
      // This ensures consistent but distributed assignment
      const eventHash = (eventText + player + team).length;
      return eventHash % 2 === 0 ? 'home' : 'away';
    }
    
    // For specific team events, try to determine from team name or player context
    if (team && team.trim()) {
      // If team information is available, we could do more intelligent mapping
      // For now, default to alternating pattern
      const teamHash = team.length;
      return teamHash % 2 === 0 ? 'home' : 'away';
    }
    
    // Final fallback: alternate based on player name hash
    if (player && player.trim()) {
      const playerHash = player.length;
      return playerHash % 2 === 0 ? 'home' : 'away';
    }
    
    // Ultimate fallback: home (but this should rarely be reached)
    return 'home';
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

  private mapTeamDetailsFromApi(apiData: any): any | null {
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

      return {
        id: row.id?.toString() || '',
        name: cells[0]?.text?.[0] || 'Unknown Team',
        logo: cells[1]?.image?.url || null,
        website: cells[2]?.url?.href || null,
        portrait: cells[3]?.text?.[0] || null,
        league: {
          id: '',
          name: cells[4]?.text?.[0] || 'Unknown League'
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
          id: row.id?.toString() || '',
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

        const date = row.cells[0]?.text?.[0] || '';
        const time = row.cells[1]?.text?.[0] || '';
        const homeTeam = row.cells[2]?.text?.[0] || '';
        const awayTeam = row.cells[4]?.text?.[0] || '';
        const venue = row.cells[5]?.text?.[0] || '';

        // Extract team IDs if available
        const homeTeamId = row.cells[2]?.link?.ids?.[0]?.toString() || '';
        const awayTeamId = row.cells[4]?.link?.ids?.[0]?.toString() || '';

        const game: Game = {
          id: row.id?.toString() || `${homeTeamId}_${awayTeamId}_${date}`,
          home_team: {
            id: homeTeamId,
            name: homeTeam,
            short_name: homeTeam.substring(0, 3).toUpperCase()
          },
          away_team: {
            id: awayTeamId,
            name: awayTeam,
            short_name: awayTeam.substring(0, 3).toUpperCase()
          },
          home_score: null,
          away_score: null,
          status: 'upcoming' as const,
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

        // Based on typical rankings API structure:
        // cells[0] = position/rank
        // cells[1] = team (with name, logo, id)
        // cells[2] = games played (SP)
        // cells[3] = wins
        // cells[4] = draws/ties
        // cells[5] = losses
        // cells[6] = goals (format like "10:5")
        // cells[7] = goal difference
        // cells[8] = points

        const goalsText = row.cells[6]?.text?.[0] || '0:0';
        const [goalsFor, goalsAgainst] = goalsText.split(':').map((g: string) => parseInt(g.trim()) || 0);
        
        const team = {
          position: parseInt(row.cells[0]?.text?.[0] || '0') || 0,
          teamId: row.cells[1]?.link?.ids?.[0]?.toString() || '',
          teamName: row.cells[1]?.text?.[0] || '',
          teamLogo: row.cells[1]?.image?.url || null,
          games: parseInt(row.cells[2]?.text?.[0] || '0') || 0,
          wins: parseInt(row.cells[3]?.text?.[0] || '0') || 0,
          draws: parseInt(row.cells[4]?.text?.[0] || '0') || 0,
          losses: parseInt(row.cells[5]?.text?.[0] || '0') || 0,
          goalsFor,
          goalsAgainst,
          goalDifference: parseInt(row.cells[7]?.text?.[0] || '0') || 0,
          points: parseInt(row.cells[8]?.text?.[0] || '0') || 0
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
}