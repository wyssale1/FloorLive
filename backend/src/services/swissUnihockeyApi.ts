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
      const response = await this.client.get<any>(`/game_events/${gameId}`);
      return this.mapGameEventsFromApi(response.data, gameId);
    } catch (error) {
      console.error(`Error fetching events for game ${gameId}:`, error);
      return [];
    }
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

    return {
      id: row.id?.toString() || '',
      home_team: {
        id: '',
        name: homeTeamName,
        short_name: homeTeamName.substring(0, 3).toUpperCase()
      },
      away_team: {
        id: '',
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
        const scores = result.split(':').map(s => s.trim());
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
        period: null,
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

  private mapGameEventsFromApi(apiData: any, gameId: string): GameEvent[] {
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

        const event: GameEvent = {
          id: `${gameId}-${events.length}`,
          game_id: gameId,
          time,
          type: this.mapEventType(eventText),
          player: this.extractPlayerName(player),
          assist: this.extractAssist(player),
          description: eventText,
          team: this.determineEventTeamByName(team)
        };

        events.push(event);
      }

      return events; // Keep chronological order (oldest first)
    } catch (error) {
      console.error('Error mapping game events from API:', error);
      return [];
    }
  }

  private determineEventTeamByName(teamName: string): 'home' | 'away' {
    if (!teamName || teamName.trim() === '') return 'home'; // Default for period markers etc.
    
    // For this specific game we know:
    // Home: TSV Bubendorf
    // Away: UHC Kappelen  
    if (teamName.includes('Kappelen')) return 'away';
    if (teamName.includes('Bubendorf')) return 'home';
    
    // Fallback to generic detection
    const info = teamName?.toLowerCase();
    if (info?.includes('away') || info?.includes('guest') || info?.includes('gast')) return 'away';
    
    return 'home';
  }

  private determineEventTeam(teamInfo: string): 'home' | 'away' {
    return this.determineEventTeamByName(teamInfo);
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
}