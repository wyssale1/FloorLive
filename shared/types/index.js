/**
 * Utility function to determine game_class from league name and optional player data
 * Based on Swiss Unihockey API patterns:
 * - Men's leagues: game_class = '11'
 * - Women's leagues: game_class = '21'
 */
export function determineGameClass(leagueName, players) {
    if (!leagueName) {
        return '11'; // Default to men's
    }
    const leagueLower = leagueName.toLowerCase();
    // Check for explicit women's indicators in league name
    if (leagueLower.includes('damen') ||
        leagueLower.includes('women') ||
        leagueLower.includes('dnlb') ||
        leagueLower.includes('female') ||
        leagueLower.includes('frauen')) {
        return '21'; // Women's game class
    }
    // For ambiguous leagues like "L-UPL", use player position data
    if (players && players.length > 0) {
        const femininePositions = players.filter(player => {
            const position = player.position?.toLowerCase() || '';
            return (position.includes('stürmerin') ||
                position.includes('verteidigerin') ||
                position.includes('torhüterin'));
        });
        // If more than 30% of players have feminine positions, it's likely a women's team
        if (femininePositions.length > 0 && femininePositions.length / players.length >= 0.3) {
            return '21'; // Women's game class
        }
    }
    return '11'; // Default to men's game class
}
//# sourceMappingURL=index.js.map