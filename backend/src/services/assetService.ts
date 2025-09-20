import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AssetService {
  private readonly ASSETS_DIR = path.join(__dirname, '..', '..', 'assets');
  private readonly PLAYERS_DIR = path.join(this.ASSETS_DIR, 'players');
  private readonly LOGOS_DIR = path.join(this.ASSETS_DIR, 'logos');

  /**
   * Check if a team logo exists
   */
  async hasTeamLogo(teamId: string): Promise<boolean> {
    const logoDir = path.join(this.LOGOS_DIR, `team-${teamId}`);
    const logoPath = path.join(logoDir, 'small.webp');

    try {
      await fs.access(logoPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a player image exists
   */
  async hasPlayerImage(playerId: string): Promise<boolean> {
    const playerDir = path.join(this.PLAYERS_DIR, playerId);
    const imagePath = path.join(playerDir, `${playerId}_small.webp`);

    try {
      await fs.access(imagePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get team logo URLs (build-time processed assets)
   */
  getTeamLogoUrls(teamId: string): {
    large: Record<string, string>;
    small: Record<string, string>;
  } {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const baseUrl = isDevelopment
      ? `http://localhost:3001/assets/logos/team-${teamId}`
      : `/assets/logos/team-${teamId}`;

    return {
      large: {
        avif: `${baseUrl}/large.avif`,
        webp: `${baseUrl}/large.webp`,
        png: `${baseUrl}/large.png`
      },
      small: {
        avif: `${baseUrl}/small.avif`,
        webp: `${baseUrl}/small.webp`,
        png: `${baseUrl}/small.png`
      }
    };
  }

  /**
   * Get player image URLs (build-time processed assets)
   */
  getPlayerImageUrls(playerId: string): Record<string, Record<string, string>> {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const baseUrl = isDevelopment
      ? `http://localhost:3001/assets/players/${playerId}`
      : `/assets/players/${playerId}`;

    return {
      small: {
        avif: `${baseUrl}/${playerId}_small.avif`,
        webp: `${baseUrl}/${playerId}_small.webp`,
        png: `${baseUrl}/${playerId}_small.png`
      },
      medium: {
        avif: `${baseUrl}/${playerId}_medium.avif`,
        webp: `${baseUrl}/${playerId}_medium.webp`,
        png: `${baseUrl}/${playerId}_medium.png`
      },
      large: {
        avif: `${baseUrl}/${playerId}_large.avif`,
        webp: `${baseUrl}/${playerId}_large.webp`,
        png: `${baseUrl}/${playerId}_large.png`
      }
    };
  }
}

export const assetService = new AssetService();