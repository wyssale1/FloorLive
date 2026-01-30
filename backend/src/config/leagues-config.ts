/**
 * SwissUnihockey League Configuration
 *
 * Hardcoded league structure based on API testing (Season 2025).
 * Groups are required for leagues below NLB (1. Liga and lower).
 */

export interface LeagueConfig {
    id: number;
    gameClass: number;
    name: string;
    displayName: string;
    groups: string[] | null; // null = no groups needed
    priority: number; // Lower = higher priority (shown first)
    defaultExpanded: boolean;
}

export interface LeagueTier {
    name: string;
    leagues: LeagueConfig[];
}

// Game class constants
export const GAME_CLASS = {
    MEN: 11,
    WOMEN: 21,
} as const;

// League ID constants
export const LEAGUE_ID = {
    L_UPL: 24,
    NLB: 2,
    ERSTE_LIGA: 3,
    ZWEITE_LIGA: 4,
    DRITTE_LIGA: 5,
    VIERTE_LIGA: 6,
} as const;

/**
 * Top tier leagues - loaded by default
 */
export const TOP_TIER_LEAGUES: LeagueConfig[] = [
    {
        id: LEAGUE_ID.L_UPL,
        gameClass: GAME_CLASS.MEN,
        name: 'L-UPL Men',
        displayName: 'Herren L-UPL',
        groups: null,
        priority: 1,
        defaultExpanded: true,
    },
    {
        id: LEAGUE_ID.L_UPL,
        gameClass: GAME_CLASS.WOMEN,
        name: 'L-UPL Women',
        displayName: 'Damen L-UPL',
        groups: null,
        priority: 2,
        defaultExpanded: true,
    },
    {
        id: LEAGUE_ID.NLB,
        gameClass: GAME_CLASS.MEN,
        name: 'HNLB',
        displayName: 'Herren NLB',
        groups: null,
        priority: 3,
        defaultExpanded: true,
    },
    {
        id: LEAGUE_ID.NLB,
        gameClass: GAME_CLASS.WOMEN,
        name: 'DNLB',
        displayName: 'Damen NLB',
        groups: null,
        priority: 4,
        defaultExpanded: true,
    },
];

/**
 * Lower tier leagues - loaded on demand (lazy loading)
 * Groups are based on Season 2025 structure, may need updates per season
 */
export const LOWER_TIER_LEAGUES: LeagueConfig[] = [
    // 1. Liga - 2 Gruppen (Herren & Damen)
    {
        id: LEAGUE_ID.ERSTE_LIGA,
        gameClass: GAME_CLASS.MEN,
        name: '1. Liga Herren',
        displayName: '1. Liga Herren',
        groups: ['Gruppe 1', 'Gruppe 2'],
        priority: 10,
        defaultExpanded: false,
    },
    {
        id: LEAGUE_ID.ERSTE_LIGA,
        gameClass: GAME_CLASS.WOMEN,
        name: '1. Liga Damen',
        displayName: '1. Liga Damen',
        groups: ['Gruppe 1', 'Gruppe 2'],
        priority: 11,
        defaultExpanded: false,
    },

    // 2. Liga - Herren 4 Gruppen, Damen 3 Gruppen
    {
        id: LEAGUE_ID.ZWEITE_LIGA,
        gameClass: GAME_CLASS.MEN,
        name: '2. Liga Herren',
        displayName: '2. Liga Herren',
        groups: ['Gruppe 1', 'Gruppe 2', 'Gruppe 3', 'Gruppe 4'],
        priority: 20,
        defaultExpanded: false,
    },
    {
        id: LEAGUE_ID.ZWEITE_LIGA,
        gameClass: GAME_CLASS.WOMEN,
        name: '2. Liga Damen',
        displayName: '2. Liga Damen',
        groups: ['Gruppe 1', 'Gruppe 2', 'Gruppe 3'],
        priority: 21,
        defaultExpanded: false,
    },

    // 3. Liga - Herren 6 Gruppen
    {
        id: LEAGUE_ID.DRITTE_LIGA,
        gameClass: GAME_CLASS.MEN,
        name: '3. Liga Herren',
        displayName: '3. Liga Herren',
        groups: ['Gruppe 1', 'Gruppe 2', 'Gruppe 3', 'Gruppe 4', 'Gruppe 5', 'Gruppe 6'],
        priority: 30,
        defaultExpanded: false,
    },

    // 4. Liga - Herren 8 Gruppen
    {
        id: LEAGUE_ID.VIERTE_LIGA,
        gameClass: GAME_CLASS.MEN,
        name: '4. Liga Herren',
        displayName: '4. Liga Herren',
        groups: ['Gruppe 1', 'Gruppe 2', 'Gruppe 3', 'Gruppe 4', 'Gruppe 5', 'Gruppe 6', 'Gruppe 7', 'Gruppe 8'],
        priority: 40,
        defaultExpanded: false,
    },
];

/**
 * All leagues combined
 */
export const ALL_LEAGUES: LeagueConfig[] = [...TOP_TIER_LEAGUES, ...LOWER_TIER_LEAGUES];

/**
 * Get all league/group combinations for lower tiers
 * Each group becomes a separate entry for API calls
 */
export function getLowerTierLeagueGroups(): Array<{
    league: LeagueConfig;
    group: string | null;
    displayName: string;
}> {
    const result: Array<{
        league: LeagueConfig;
        group: string | null;
        displayName: string;
    }> = [];

    for (const league of LOWER_TIER_LEAGUES) {
        if (league.groups && league.groups.length > 0) {
            for (const group of league.groups) {
                result.push({
                    league,
                    group,
                    displayName: `${league.displayName} ${group}`,
                });
            }
        } else {
            result.push({
                league,
                group: null,
                displayName: league.displayName,
            });
        }
    }

    return result;
}

/**
 * Get unique key for a league/group combination
 */
export function getLeagueGroupKey(leagueId: number, gameClass: number, group?: string | null): string {
    const base = `${leagueId}-${gameClass}`;
    return group ? `${base}-${group}` : base;
}

/**
 * Find league config by API league name
 */
export function findLeagueByApiName(apiLeagueName: string): LeagueConfig | undefined {
    const nameLower = apiLeagueName.toLowerCase();

    // Try exact matches first
    for (const league of ALL_LEAGUES) {
        if (league.name.toLowerCase() === nameLower || league.displayName.toLowerCase() === nameLower) {
            return league;
        }
    }

    // Try partial matches
    if (nameLower.includes('l-upl') || nameLower.includes('lupl')) {
        if (nameLower.includes('damen') || nameLower.includes('women')) {
            return TOP_TIER_LEAGUES.find((l) => l.id === LEAGUE_ID.L_UPL && l.gameClass === GAME_CLASS.WOMEN);
        }
        return TOP_TIER_LEAGUES.find((l) => l.id === LEAGUE_ID.L_UPL && l.gameClass === GAME_CLASS.MEN);
    }

    if (nameLower.includes('nlb')) {
        if (nameLower.includes('damen') || nameLower.includes('dnlb')) {
            return TOP_TIER_LEAGUES.find((l) => l.id === LEAGUE_ID.NLB && l.gameClass === GAME_CLASS.WOMEN);
        }
        return TOP_TIER_LEAGUES.find((l) => l.id === LEAGUE_ID.NLB && l.gameClass === GAME_CLASS.MEN);
    }

    return undefined;
}
