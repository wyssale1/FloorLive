// Team name mapping system - normalize/override team names from API
export const TEAM_NAME_MAP: Record<string, string> = {
  // Example mappings - add more as needed
  'HCR': 'HC Rychenberg Winterthur',
  'ZSC': 'ZSC Lions Zürich',
  'HCD': 'HC Davos',
  'FBK': 'Floorball Köniz',
  'UAM': 'UHC Alligator Malans',
  'UBR': 'Unihockey Basel Regio',
  'SWE': 'SV Wiler-Ersigen',
  'UHT': 'UHC Thun',
  'FBT': 'Floorball Thurgau',
  'GCZ': 'Grasshopper Club Zürich',
  'UHD': 'UHC Dietlikon'
};

/**
 * Maps/normalizes team names from API response
 * If a mapping exists, use it. Otherwise, return original name.
 */
export function mapTeamName(apiTeamName: string): string {
  return TEAM_NAME_MAP[apiTeamName] || apiTeamName;
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