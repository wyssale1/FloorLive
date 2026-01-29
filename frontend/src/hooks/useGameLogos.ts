import { useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';

interface GameLogosState {
    homeLogo: string | null;
    awayLogo: string | null;
    isLoading: boolean;
    error: boolean;
}

// Simple in-memory cache for game logos (keyed by gameId)
const gameLogosCache = new Map<string, { home: string | null; away: string | null }>();

/**
 * Hook to lazy-load team logos from game details API
 * Fetches both home and away logos when they're not available
 */
export function useGameLogos(
    gameId: string | undefined,
    existingHomeLogo?: string,
    existingAwayLogo?: string
): GameLogosState {
    const cacheKey = gameId || '';
    const cached = gameLogosCache.get(cacheKey);

    const [state, setState] = useState<GameLogosState>({
        homeLogo: existingHomeLogo || cached?.home || null,
        awayLogo: existingAwayLogo || cached?.away || null,
        isLoading: false,
        error: false
    });

    useEffect(() => {
        // If we already have both logos or no game ID, don't fetch
        if (!gameId || (existingHomeLogo && existingAwayLogo)) {
            return;
        }

        // Check cache
        if (gameLogosCache.has(gameId)) {
            const cached = gameLogosCache.get(gameId)!;
            setState(prev => ({
                ...prev,
                homeLogo: existingHomeLogo || cached.home,
                awayLogo: existingAwayLogo || cached.away
            }));
            return;
        }

        let cancelled = false;

        const fetchLogos = async () => {
            setState(prev => ({ ...prev, isLoading: true }));

            try {
                const gameDetails = await apiClient.getGameDetails(gameId);
                const homeLogo = gameDetails?.homeTeam?.logo || null;
                const awayLogo = gameDetails?.awayTeam?.logo || null;

                // Cache the result
                gameLogosCache.set(gameId, { home: homeLogo, away: awayLogo });

                if (!cancelled) {
                    setState({
                        homeLogo: existingHomeLogo || homeLogo,
                        awayLogo: existingAwayLogo || awayLogo,
                        isLoading: false,
                        error: false
                    });
                }
            } catch (error) {
                console.warn(`Failed to fetch logos for game ${gameId}:`, error);
                gameLogosCache.set(gameId, { home: null, away: null });

                if (!cancelled) {
                    setState({
                        homeLogo: existingHomeLogo || null,
                        awayLogo: existingAwayLogo || null,
                        isLoading: false,
                        error: true
                    });
                }
            }
        };

        fetchLogos();

        return () => {
            cancelled = true;
        };
    }, [gameId, existingHomeLogo, existingAwayLogo]);

    return state;
}

/**
 * Get a single team's logo from the game logos cache
 * This allows TeamLogo component to benefit from pre-fetched data
 */
export function getTeamLogoFromGameCache(gameId: string, teamSide: 'home' | 'away'): string | null {
    const cached = gameLogosCache.get(gameId);
    if (!cached) return null;
    return teamSide === 'home' ? cached.home : cached.away;
}
