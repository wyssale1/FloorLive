import { useState, useMemo } from 'react'

export const LEAGUE_ORDER_PREFERENCES = [
    'Herren L-UPL',     // NLA Men (league 1)
    'Damen L-UPL',      // NLA Women (league 1)
    'Herren NLB',       // NLB Men (league 2)
    'Damen NLB',        // NLB Women (league 2)
    'Herren 1. Liga',   // 1. Liga Men (league 3)
    'Damen 1. Liga',    // 1. Liga Women (league 3)
    'Herren 2. Liga',   // 2. Liga Men (league 4)
    'Damen 2. Liga',    // 2. Liga Women (league 4)
    'Herren 3. Liga',   // 3. Liga Men (league 5)
    'Damen 3. Liga'     // 3. Liga Women (league 5)
]

export function useLeagueProcessing(games: any[], leagueConfig: any) {
    const [genderFilter, setGenderFilter] = useState<'Herren' | 'Damen'>('Herren')

    const filteredLowerTierLeagues = useMemo(() => {
        if (!leagueConfig?.lowerTier) return []

        return leagueConfig.lowerTier.filter((league: any) =>
            league.displayName.includes(genderFilter)
        )
    }, [leagueConfig, genderFilter])

    const gamesByLeague = useMemo(() => {
        const grouped: Record<string, any[]> = {}

        games.forEach((game: { league?: { name?: string } }) => {
            const leagueName = game.league?.name || 'Unknown League'
            if (!grouped[leagueName]) {
                grouped[leagueName] = []
            }
            grouped[leagueName].push(game)
        })

        return grouped
    }, [games])

    const orderedLeagueNames = useMemo(() => {
        const leagueNames = Object.keys(gamesByLeague)

        return [
            ...LEAGUE_ORDER_PREFERENCES.filter(league => leagueNames.includes(league)),
            ...leagueNames.filter(league => !LEAGUE_ORDER_PREFERENCES.includes(league)).sort()
        ]
    }, [gamesByLeague])

    return {
        genderFilter,
        setGenderFilter,
        filteredLowerTierLeagues,
        gamesByLeague,
        orderedLeagueNames
    }
}
