import type { Game, Team, GameEvent, ApiResponse } from '../shared/types/index.js';

// Re-export types for external usage
export type { Game, Team, GameEvent, ApiResponse };

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async getGamesByDate(date: string): Promise<Game[]> {
    try {
      const response = await fetch(`${this.baseURL}/games?date=${date}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse<Game> = await response.json();
      
      // Flatten all games from all leagues
      const allGames: Game[] = [];
      Object.values(data.gamesByLeague).forEach(games => {
        allGames.push(...games);
      });
      
      return allGames;
    } catch (error) {
      console.error('Error fetching games by date:', error);
      return [];
    }
  }

  async getLiveGames(): Promise<Game[]> {
    try {
      const response = await fetch(`${this.baseURL}/games/live`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.games || [];
    } catch (error) {
      console.error('Error fetching live games:', error);
      return [];
    }
  }

  async getGameDetails(gameId: string): Promise<Game | null> {
    try {
      const response = await fetch(`${this.baseURL}/games/${gameId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching game details:', error);
      return null;
    }
  }

  async getGameEvents(gameId: string): Promise<GameEvent[]> {
    try {
      const response = await fetch(`${this.baseURL}/games/${gameId}/events`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.events || [];
    } catch (error) {
      console.error('Error fetching game events:', error);
      return [];
    }
  }

  // Helper methods to match existing frontend interface
  getLeaguesForDate(games: Game[]): string[] {
    const leagues = [...new Set(games.map(game => game.league.name))];
    return leagues.sort();
  }

  getGamesByLeague(games: Game[], leagueName: string): Game[] {
    return games.filter(game => game.league.name === leagueName);
  }


  // Convert API game format to frontend format for compatibility
  adaptGameForFrontend(apiGame: Game): any {
    return {
      id: apiGame.id,
      homeTeam: {
        id: apiGame.home_team.id,
        name: apiGame.home_team.name,
        shortName: apiGame.home_team.short_name,
        logo: apiGame.home_team.logo
      },
      awayTeam: {
        id: apiGame.away_team.id,
        name: apiGame.away_team.name,
        shortName: apiGame.away_team.short_name,
        logo: apiGame.away_team.logo
      },
      homeScore: apiGame.home_score,
      awayScore: apiGame.away_score,
      status: apiGame.status,
      period: apiGame.period,
      time: apiGame.time,
      league: apiGame.league.name,
      startTime: apiGame.start_time,
      gameDate: apiGame.game_date,
      isLive: apiGame.status === 'live'
    };
  }


}

export const apiClient = new ApiClient();