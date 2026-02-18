import type {
  Game, Team, GameEvent, Player, PlayerStatistics, PlayerGamePerformance,
  TeamStatistics, TeamRanking, GameResponse
} from '../types/domain';
import type {
  ApiGame, ApiGameEvent, ApiPlayer, ApiPlayerStatistics,
  ApiPlayerGamePerformance, ApiResponse
} from '../types/api';
import {
  transformGame, transformGameEvent, transformPlayer, transformPlayerStatistics,
  transformPlayerGamePerformance
} from '../types/api';
import { getCurrentSeasonYear } from './seasonUtils';

// Re-export clean domain types for external usage
export type {
  Game, Team, GameEvent, Player, PlayerStatistics, PlayerGamePerformance,
  TeamStatistics, TeamRanking, GameResponse
};

// League configuration types for lazy-loading
export interface LeagueConfigItem {
  id: number;
  gameClass: number;
  name: string;
  displayName: string;
  groups: string[] | null;
  priority: number;
  defaultExpanded: boolean;
}

export interface LeagueGroupConfigItem {
  id: number;
  gameClass: number;
  name: string;
  displayName: string;
  group: string | null;
  priority: number;
  defaultExpanded: boolean;
}

// Chemistry / Duo-Analysis types
export interface MatrixEntry {
  assistRawName: string
  assistDisplayName: string
  assistPlayerId: string | null
  scorerRawName: string
  scorerDisplayName: string
  scorerPlayerId: string | null
  total: number
  homeGoals: number
  awayGoals: number
}

export interface SoloGoalEntry {
  scorerRawName: string
  scorerDisplayName: string
  scorerPlayerId: string | null
  total: number
  homeGoals: number
  awayGoals: number
}

export interface ChemistryStatusResponse {
  teamId: string
  season: string
  status: 'not_started' | 'processing' | 'done' | 'error'
  gamesTotal: number
  gamesProcessed: number
  hasRoster: boolean
  errorMessage?: string
}

export interface ChemistryMatrixResponse extends ChemistryStatusResponse {
  matrix: MatrixEntry[]
  soloGoals: SoloGoalEntry[]
}

// Dynamic API URL detection for Tailscale development
const getApiBaseUrl = () => {
  // First check if explicitly set via environment
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // In development, detect if we're running on Tailscale network
  if (import.meta.env.DEV) {
    const currentHost = window.location.hostname;

    // Check if we're on a network IP (not localhost)
    if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
      // Use Tailscale IP for backend
      return `http://100.99.89.57:3001/api`;
    }
  }

  // Default fallback
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

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

      const data: ApiResponse<ApiGame> = await response.json();

      // Flatten all games from all leagues and transform them using our type-safe transformers
      const allGames: Game[] = [];
      Object.values(data.gamesByLeague).forEach(games => {
        games.forEach(apiGame => {
          allGames.push(transformGame(apiGame));
        });
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
      const apiGames: ApiGame[] = data.games || [];
      return apiGames.map(transformGame);
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

      const apiGame: ApiGame = await response.json();
      return transformGame(apiGame);
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
      const apiEvents: ApiGameEvent[] = data.events || [];
      return apiEvents.map(transformGameEvent);
    } catch (error) {
      console.error('Error fetching game events:', error);
      return [];
    }
  }

  async getTeamDetails(teamId: string): Promise<any | null> {
    try {
      const response = await fetch(`${this.baseURL}/teams/${teamId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching team details:', error);
      return null;
    }
  }

  async getTeamPlayers(teamId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseURL}/teams/${teamId}/players`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.players || [];
    } catch (error) {
      console.error('Error fetching team players:', error);
      return [];
    }
  }

  async getTeamStatistics(teamId: string): Promise<any | null> {
    try {
      const response = await fetch(`${this.baseURL}/teams/${teamId}/statistics`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.statistics || null;
    } catch (error) {
      console.error('Error fetching team statistics:', error);
      return null;
    }
  }

  async getTeamCompetitions(teamId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseURL}/teams/${teamId}/competitions`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.competitions || [];
    } catch (error) {
      console.error('Error fetching team competitions:', error);
      return [];
    }
  }

  async getTeamUpcomingGames(teamId: string): Promise<Game[]> {
    try {
      const currentSeason = getCurrentSeasonYear();
      const response = await fetch(`https://api-v2.swissunihockey.ch/api/games?mode=team&season=${currentSeason}&team_id=${teamId}&games_per_page=30`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiData = await response.json();
      const gameRows = apiData.data?.regions?.[0]?.rows || [];

      // Filter to only upcoming games (today or future) and transform to our format
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Reset to start of day for comparison

      const upcomingGames: any[] = [];

      gameRows.forEach((row: any) => {
        if (!row.cells || row.cells.length < 5) return;

        // Extract game date from first cell
        const dateTimeText = row.cells[0]?.text?.[0] || '';
        const timeText = row.cells[0]?.text?.[1] || '';

        // Parse date (format: DD.MM.YYYY)
        const dateParts = dateTimeText.split('.');
        if (dateParts.length !== 3) return;

        const gameDate = new Date(
          parseInt(dateParts[2]), // year
          parseInt(dateParts[1]) - 1, // month (0-indexed)
          parseInt(dateParts[0]) // day
        );
        gameDate.setHours(0, 0, 0, 0);

        // Only include upcoming games
        if (gameDate < currentDate) return;

        // Extract game ID from link
        const gameId = row.link?.ids?.[0]?.toString() || '';
        if (!gameId) return;

        // Extract team names and check which is highlighted (current viewing team)
        const homeTeamName = row.cells[2]?.text?.[0] || '';
        const awayTeamName = row.cells[3]?.text?.[0] || '';
        const isHomeTeamViewing = row.cells[2]?.highlight === true;
        const isAwayTeamViewing = row.cells[3]?.highlight === true;

        // Extract score if available
        const scoreText = row.cells[4]?.text?.[0] || '';
        const isFinished = scoreText && scoreText !== '';

        // Convert DD.MM.YYYY to YYYY-MM-DD format for proper Date parsing
        const convertDateFormat = (ddmmyyyy: string): string => {
          const parts = ddmmyyyy.split('.');
          if (parts.length === 3) {
            const [day, month, year] = parts;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
          return ddmmyyyy; // fallback
        };

        const formattedDate = convertDateFormat(dateTimeText);

        // Create game object in our format
        const game = {
          id: gameId,
          homeTeam: {
            id: isHomeTeamViewing ? teamId : '',
            name: homeTeamName,
            shortName: homeTeamName.substring(0, 3).toUpperCase(),
            logo: '',
            isCurrentTeam: isHomeTeamViewing // Add flag to identify current viewing team
          },
          awayTeam: {
            id: isAwayTeamViewing ? teamId : '',
            name: awayTeamName,
            shortName: awayTeamName.substring(0, 3).toUpperCase(),
            logo: '',
            isCurrentTeam: isAwayTeamViewing // Add flag to identify current viewing team
          },
          homeScore: null,
          awayScore: null,
          status: isFinished ? 'finished' : 'upcoming',
          startTime: timeText, // Only the time (e.g., "17:00")
          gameDate: formattedDate, // Properly formatted date for JavaScript Date parsing
          league: {
            id: '',
            name: apiData.data?.title?.split(',')[1]?.trim() || 'Unknown League'
          },
          location: row.cells[1]?.text?.[0] || '',
          venue: {
            name: row.cells[1]?.text?.[0] || '',
            address: row.cells[1]?.text?.[1] || ''
          }
        };

        upcomingGames.push(game);
      });

      // Batch-fetch game phases and enrich upcoming games with gamePhase
      if (upcomingGames.length > 0) {
        try {
          const gameIds = upcomingGames.map((g: any) => g.id);
          const phases = await this.getGamePhases(gameIds);
          upcomingGames.forEach((g: any) => {
            if (phases[g.id]) g.gamePhase = phases[g.id];
          });
        } catch {
          // Non-critical: games still show without phase badge
        }
      }

      return upcomingGames;
    } catch (error) {
      console.error('Error fetching team upcoming games:', error);
      return [];
    }
  }

  async getHeadToHeadGames(gameId: string): Promise<Game[]> {
    try {
      const response = await fetch(`${this.baseURL}/games/${gameId}/head-to-head`);
      if (!response.ok) return [];

      const data = await response.json();
      const apiGames: ApiGame[] = data.games || [];
      return apiGames.map(transformGame);
    } catch (error) {
      console.error('Error fetching head-to-head games:', error);
      return [];
    }
  }

  async getSeriesStanding(gameId: string): Promise<import('../types/domain').PlayoffSeries | null> {
    try {
      const response = await fetch(`${this.baseURL}/games/${gameId}/series`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.series ?? null;
    } catch {
      return null;
    }
  }

  async getGamePhases(gameIds: string[]): Promise<Record<string, 'regular' | 'cup' | 'playoff'>> {
    if (gameIds.length === 0) return {};
    try {
      const response = await fetch(`${this.baseURL}/games/phases?ids=${gameIds.join(',')}`);
      if (!response.ok) return {};
      return await response.json();
    } catch {
      return {};
    }
  }


  async getRankings(params: { season?: string; league?: string; game_class?: string; group?: string; leagueName?: string; teamNames?: string[] } = {}): Promise<any | null> {
    try {
      const searchParams = new URLSearchParams();
      if (params.season) searchParams.append('season', params.season);
      if (params.league) searchParams.append('league', params.league);
      if (params.game_class) searchParams.append('game_class', params.game_class);
      if (params.group) searchParams.append('group', params.group);
      if (params.leagueName) searchParams.append('leagueName', params.leagueName);
      if (params.teamNames) {
        params.teamNames.forEach(teamName => {
          searchParams.append('teamNames', teamName);
        });
      }

      const url = `${this.baseURL}/leagues/rankings${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.rankings || null;
    } catch (error) {
      console.error('Error fetching rankings:', error);
      return null;
    }
  }

  /**
   * Get league configuration for lazy-loading calendar
   * Returns top-tier (auto-expanded) and lower-tier (collapsed) leagues
   */
  async getLeagueConfig(): Promise<{
    topTier: LeagueConfigItem[];
    lowerTier: LeagueGroupConfigItem[];
  } | null> {
    try {
      const response = await fetch(`${this.baseURL}/leagues/config`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return {
        topTier: data.topTier || [],
        lowerTier: data.lowerTier || []
      };
    } catch (error) {
      console.error('Error fetching league config:', error);
      return null;
    }
  }

  /**
   * Get games for a specific league/group (lazy-loading)
   */
  async getLeagueGames(params: {
    date: string;
    league: number;
    gameClass: number;
    group?: string;
  }): Promise<Game[]> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('date', params.date);
      searchParams.append('league', params.league.toString());
      searchParams.append('game_class', params.gameClass.toString());
      if (params.group) {
        searchParams.append('group', params.group);
      }

      const response = await fetch(`${this.baseURL}/games/league?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const apiGames: ApiGame[] = data.games || [];
      return apiGames.map(transformGame);
    } catch (error) {
      console.error('Error fetching league games:', error);
      return [];
    }
  }

  /**
   * Get game count for a specific league/group (for pre-filtering)
   */
  async getLeagueGameCount(params: {
    date: string;
    league: number;
    gameClass: number;
    group?: string;
  }): Promise<number> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('date', params.date);
      searchParams.append('league', params.league.toString());
      searchParams.append('game_class', params.gameClass.toString());
      if (params.group) {
        searchParams.append('group', params.group);
      }

      const response = await fetch(`${this.baseURL}/games/league/count?${searchParams.toString()}`);
      if (!response.ok) {
        return 0;
      }

      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('Error fetching league game count:', error);
      return 0;
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



  // Player-related methods
  async getPlayerDetails(playerId: string): Promise<Player | null> {
    try {
      const response = await fetch(`${this.baseURL}/players/${playerId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const apiPlayer: ApiPlayer = data.player;
      return apiPlayer ? transformPlayer(apiPlayer) : null;
    } catch (error) {
      console.error('Error fetching player details:', error);
      return null;
    }
  }

  async getPlayerStatistics(playerId: string): Promise<PlayerStatistics[]> {
    try {
      const response = await fetch(`${this.baseURL}/players/${playerId}/statistics`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const apiStats: ApiPlayerStatistics[] = data.statistics || [];
      return apiStats.map(transformPlayerStatistics);
    } catch (error) {
      console.error('Error fetching player statistics:', error);
      return [];
    }
  }

  async getPlayerOverview(playerId: string): Promise<PlayerGamePerformance[]> {
    try {
      const response = await fetch(`${this.baseURL}/players/${playerId}/overview`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const apiPerformances: ApiPlayerGamePerformance[] = data.overview || [];
      return apiPerformances.map(transformPlayerGamePerformance);
    } catch (error) {
      console.error('Error fetching player overview:', error);
      return [];
    }
  }

  // Search Methods
  async search(query: string, limit?: number): Promise<{ teams: any[], players: any[] }> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      if (limit) params.append('limit', limit.toString());

      const response = await fetch(`${this.baseURL}/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        teams: data.teams || [],
        players: data.players || []
      };
    } catch (error) {
      console.error('Error performing search:', error);
      return { teams: [], players: [] };
    }
  }

  async searchTeams(query: string, limit?: number): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      if (limit) params.append('limit', limit.toString());

      const response = await fetch(`${this.baseURL}/teams/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.teams || [];
    } catch (error) {
      console.error('Error searching teams:', error);
      return [];
    }
  }

  async searchPlayers(query: string, limit?: number): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      if (limit) params.append('limit', limit.toString());

      const response = await fetch(`${this.baseURL}/players/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.players || [];
    } catch (error) {
      console.error('Error searching players:', error);
      return [];
    }
  }

  // ─── Chemistry / Duo-Analysis ───────────────────────────────

  async triggerChemistryAnalysis(teamId: string, season: string): Promise<ChemistryStatusResponse> {
    try {
      const response = await fetch(`${this.baseURL}/teams/${teamId}/chemistry/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ season }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error triggering chemistry analysis:', error);
      throw error;
    }
  }

  async getChemistryStatus(teamId: string, season: string): Promise<ChemistryStatusResponse> {
    const response = await fetch(`${this.baseURL}/teams/${teamId}/chemistry/status?season=${season}`);
    return await response.json();
  }

  async getChemistryMatrix(
    teamId: string,
    season: string,
    from?: string,
    to?: string,
    phases?: string[]
  ): Promise<ChemistryMatrixResponse> {
    const params = new URLSearchParams({ season });
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (phases && phases.length > 0) params.set('phase', phases.join(','));
    const response = await fetch(`${this.baseURL}/teams/${teamId}/chemistry?${params}`);
    return await response.json();
  }
}

export const apiClient = new ApiClient();