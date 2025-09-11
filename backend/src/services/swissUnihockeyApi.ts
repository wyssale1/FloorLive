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
      // Use main API endpoint as primary source - it already comes in correct chronological order
      const generalResponse = await this.client.get<any>(`/game_events/${gameId}`);
      
      if (!generalResponse.data) {
        return [];
      }

      // Process all events from the main API response
      const events = this.mapGameEventsFromApiWithTeam(generalResponse.data, gameId, 'general');
      
      // Swiss API returns events in reverse chronological order (end to start)
      // Reverse them to show forward chronological order (start to end) for frontend timeline
      return events.reverse();
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

  async getRankings(params: { season?: string; league?: string; game_class?: string; group?: string; leagueName?: string } = {}): Promise<any | null> {
    try {
      // Build clean parameter object, converting strings to proper types
      const cleanParams: Record<string, string | number> = {};
      
      if (params.season && params.season.trim()) {
        // Convert season to integer
        const seasonNum = parseInt(params.season.trim());
        if (!isNaN(seasonNum)) {
          cleanParams.season = seasonNum;
        }
      }
      
      if (params.league && params.league.trim()) {
        // Try to convert league name to ID
        const leagueId = this.getLeagueIdFromName(params.league.trim());
        if (leagueId) {
          cleanParams.league = leagueId;
        } else {
          // If it's already a number, use it directly
          const leagueNum = parseInt(params.league.trim());
          if (!isNaN(leagueNum)) {
            cleanParams.league = leagueNum;
          }
        }
      }
      
      if (params.game_class && params.game_class.trim()) {
        // Try to convert to integer
        const gameClassNum = parseInt(params.game_class.trim());
        if (!isNaN(gameClassNum)) {
          cleanParams.game_class = gameClassNum;
        } else {
          cleanParams.game_class = params.game_class.trim();
        }
      } else if (params.leagueName) {
        // Auto-detect game_class from league name if not explicitly provided
        const gameClass = this.getGameClassFromLeagueName(params.leagueName);
        if (gameClass) {
          cleanParams.game_class = gameClass;
        }
      }
      
      if (params.group && params.group.trim()) {
        cleanParams.group = params.group.trim();
      }
      
      const response = await this.client.get<any>('/rankings', { params: cleanParams });
      return this.mapRankingsFromApi(response.data);
    } catch (error) {
      console.error('Error fetching rankings:', error);
      return null;
    }
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
    try {
      const params: any = {
        mode: 'team',
        team_id: parseInt(teamId)
      };

      // Use provided season or current season
      if (season) {
        params.season = parseInt(season);
      } else {
        // Default to current season (2024/25 = 2024)
        params.season = 2024;
      }

      const response = await this.client.get<any>('/games', { params });
      
      return this.mapTeamGamesFromApi(response.data);
    } catch (error) {
      console.error('Error fetching team games:', error);
      return [];
    }
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
          name: this.parseLeagueName(apiData.data.subtitle)
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

        // Debug logging to see actual cell contents
        console.log('Row cells length:', row.cells.length);
        console.log('First few cells:', row.cells.slice(0, 6).map((cell: any, i: number) => ({
          index: i,
          text: cell?.text?.[0] || 'N/A',
          hasImage: !!cell?.image?.url,
          hasLink: !!cell?.link?.ids?.length
        })));

        // Based on actual Swiss Unihockey API structure:
        // cells[0] = position/rank
        // cells[1] = team logo (image only)
        // cells[2] = team name (text)
        // cells[3] = wins (W)
        // cells[4] = draws/ties (D)
        // cells[5] = losses (L)
        // cells[6] = ??? (needs investigation)
        // cells[7] = ??? (needs investigation)
        // cells[8] = ??? (needs investigation)
        // cells[9] = goals (format like "161:107")
        // cells[10] = goal difference (format like "+54")
        // cells[11] = ??? (needs investigation)
        // cells[12] = points (total)

        const goalsText = row.cells[9]?.text?.[0] || '0:0';
        const [goalsFor, goalsAgainst] = goalsText.split(':').map((g: string) => parseInt(g.trim()) || 0);
        const goalDiffText = row.cells[10]?.text?.[0] || '0';
        const goalDifference = parseInt(goalDiffText.replace('+', '')) || 0;
        
        // Try to parse wins/losses from different possible cell positions
        // If cells[3] contains the same value for all teams, try alternative parsing
        const cell3Value = parseInt(row.cells[3]?.text?.[0] || '0') || 0;
        const cell4Value = parseInt(row.cells[4]?.text?.[0] || '0') || 0;
        const cell5Value = parseInt(row.cells[5]?.text?.[0] || '0') || 0;
        
        // Check if this looks like games played vs wins/draws/losses
        let wins, draws, losses, games;
        
        if (cell3Value === 22 || cell3Value > 20) {
          // Likely this is games played, not wins - use a fallback calculation
          games = cell3Value;
          // Calculate approximate wins from points (assuming 3 points per win, 1 per draw)
          const totalPoints = parseInt(row.cells[12]?.text?.[0] || '0') || 0;
          // Rough estimation: if points are high relative to games, more wins
          wins = Math.floor(totalPoints / 3);
          draws = Math.max(0, totalPoints - (wins * 3));
          losses = Math.max(0, games - wins - draws);
        } else {
          // Normal parsing
          wins = cell3Value;
          draws = cell4Value;
          losses = cell5Value;
          games = wins + draws + losses;
        }

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
        profileImage
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
            twoMinute: parseInt(row.cells[7]?.text?.[0] || '0') || 0,
            fiveMinute: parseInt(row.cells[8]?.text?.[0] || '0') || 0,
            tenMinute: parseInt(row.cells[9]?.text?.[0] || '0') || 0,
            matchPenalty: parseInt(row.cells[10]?.text?.[0] || '0') || 0
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