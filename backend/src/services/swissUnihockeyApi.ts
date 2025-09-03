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
      return this.mapGameFromApi(response.data);
    } catch (error) {
      console.error(`Error fetching game ${gameId}:`, error);
      return null;
    }
  }

  async getGameEvents(gameId: string): Promise<GameEvent[]> {
    try {
      const response = await this.client.get<any>(`/games/${gameId}/events`);
      return this.mapEventsFromApi(response.data, gameId);
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

  private mapEventType(apiType: string): 'goal' | 'penalty' | 'timeout' | 'other' {
    const type = apiType?.toLowerCase();
    if (type?.includes('goal')) return 'goal';
    if (type?.includes('penalty')) return 'penalty';
    if (type?.includes('timeout')) return 'timeout';
    return 'other';
  }
}