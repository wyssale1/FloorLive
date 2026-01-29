import { useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';

interface PlayerImageState {
    profileImage: string | null;
    isLoading: boolean;
    error: boolean;
}

// Simple in-memory cache for player images
const imageCache = new Map<string, string | null>();

/**
 * Hook to lazy-load player profile image from API
 * Fetches image URL when player.profileImage is not available
 */
export function usePlayerImage(playerId: string | undefined, existingImage?: string): PlayerImageState {
    const cacheKey = playerId || '';

    const [state, setState] = useState<PlayerImageState>({
        profileImage: existingImage || imageCache.get(cacheKey) || null,
        isLoading: false,
        error: false
    });

    useEffect(() => {
        // If we already have an image or no player ID, don't fetch
        if (!playerId || existingImage || imageCache.has(playerId)) {
            if (playerId && imageCache.has(playerId) && !existingImage) {
                setState(prev => ({ ...prev, profileImage: imageCache.get(playerId) || null }));
            }
            return;
        }

        let cancelled = false;

        const fetchImage = async () => {
            setState(prev => ({ ...prev, isLoading: true }));

            try {
                const playerDetails = await apiClient.getPlayerDetails(playerId);
                const imageUrl = playerDetails?.profileImage || null;

                // Cache the result
                imageCache.set(playerId, imageUrl);

                if (!cancelled) {
                    setState({ profileImage: imageUrl, isLoading: false, error: false });
                }
            } catch (error) {
                console.warn(`Failed to fetch image for player ${playerId}:`, error);
                imageCache.set(playerId, null); // Cache the failure too

                if (!cancelled) {
                    setState({ profileImage: null, isLoading: false, error: true });
                }
            }
        };

        fetchImage();

        return () => {
            cancelled = true;
        };
    }, [playerId, existingImage]);

    return state;
}
