// Shared team emoji mapping
export const TEAM_EMOJI_MAP: Record<string, string> = {
  'ZSC Lions': '🦁',
  'HC Davos': '🛡️',
  'Floorball Köniz': '⚫',
  'UHC Alligator Malans': '🐊',
  'Unihockey Basel Regio': '🏒',
  'SV Wiler-Ersigen': '⭐',
  'UHC Thun': '🏔️',
  'Floorball Thurgau': '🔵',
  'Grasshopper Club': '🦗',
  'UHC Dietlikon': '🔴'
};

export function getTeamEmoji(teamName: string): string {
  return TEAM_EMOJI_MAP[teamName] || '🏒';
}

// League ordering preferences
export const LEAGUE_ORDER_PREFERENCES = [
  'Herren L-UPL',
  'Damen L-UPL', 
  'Herren NLB',
  'Damen NLB'
];

export function sortLeagues(leagues: string[]): string[] {
  return [
    // First, add leagues in preferred order (only if they have games)
    ...LEAGUE_ORDER_PREFERENCES.filter(league => leagues.includes(league)),
    // Then add remaining leagues alphabetically
    ...leagues.filter(league => !LEAGUE_ORDER_PREFERENCES.includes(league)).sort()
  ];
}