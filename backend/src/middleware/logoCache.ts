import { Request, Response, NextFunction } from 'express';
import { logoService } from '../services/logoService.js';


/**
 * Middleware for game detail routes - 100% non-blocking
 * Only triggers background logo processing, no response modification
 */
export function enrichGameWithLogos(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json;
  
  res.json = function(body: any) {
    // Send response first - ZERO processing, ZERO delay
    const result = originalJson.call(this, body);
    
    // Fire-and-forget logo processing (completely async)
    if (body && body.home_team && body.away_team) {
      setImmediate(() => {
        processGameDetailLogosAsync(body);
      });
    }
    
    return result;
  };
  
  next();
}

/**
 * Pure async logo processing - no blocking, no return value
 */
function processGameDetailLogosAsync(game: any): void {
  // Pure fire-and-forget processing
  const processTeam = (team: any, teamType: string) => {
    if (!team?.id || !team?.logo) return;
    
    const teamId = team.id;
    const logoUrl = team.logo;
    
    // Just trigger processing, don't wait for results
    logoService.processTeamLogoBackground(teamId, logoUrl);
  };
  
  processTeam(game.home_team, 'home');
  processTeam(game.away_team, 'away');
}