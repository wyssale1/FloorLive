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
      const response = await this.client.get<SwissUnihockeyApiResponse<any>>('/games', {
        params: {
          mode: params.mode || 'list',
          ...params
        }
      });

      return this.mapGamesFromApi(response.data.regions);
    } catch (error) {
      console.error('Error fetching games:', error);
      throw new Error('Failed to fetch games from Swiss Unihockey API');
    }
  }

  async getGamesByDate(date: string): Promise<Game[]> {
    return this.getGames({
      mode: 'list',
      date_from: date,
      date_to: date
    });
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

  private mapGamesFromApi(regions: any[]): Game[] {
    const games: Game[] = [];
    
    if (!Array.isArray(regions)) return games;

    regions.forEach(region => {
      if (region.games && Array.isArray(region.games)) {
        region.games.forEach((game: any) => {
          games.push(this.mapGameFromApi(game));
        });
      }
    });

    return games;
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