import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface LogoMetadata {
  teamId: string;
  teamName: string;
  originalUrl: string;
  downloadedAt: string;
  processedAt: string;
  sizes: {
    large: { width: number; height: number; };
    small: { width: number; height: number; };
  };
  formats: string[];
  fileSize: {
    large: Record<string, number>;
    small: Record<string, number>;
  };
}

interface LogoCache {
  version: string;
  teams: Record<string, LogoMetadata>;
  lastUpdated: string;
}

export class LogoService {
  private readonly ASSETS_DIR = path.join(__dirname, '..', '..', 'assets', 'logos');
  private readonly METADATA_FILE = path.join(this.ASSETS_DIR, 'metadata.json');
  private readonly FORMATS = ['avif', 'webp', 'png'] as const;
  private readonly SIZES = {
    large: { width: 200, height: 200 },
    small: { width: 32, height: 32 }
  };
  private readonly CACHE_DURATION_DAYS = 30;
  
  private cache: LogoCache = {
    version: '1.0.0',
    teams: {},
    lastUpdated: new Date().toISOString()
  };

  constructor() {
    this.initializeCache();
  }

  private initializeCache(): void {
    // Initialize asynchronously but don't block constructor
    setImmediate(async () => {
      try {
        await fs.mkdir(this.ASSETS_DIR, { recursive: true });
        
        // Load existing cache if it exists
        try {
          const cacheData = await fs.readFile(this.METADATA_FILE, 'utf8');
          this.cache = JSON.parse(cacheData);
        } catch (error) {
          await this.saveCache();
        }
      } catch (error) {
        console.error('[LOGO SERVICE] Failed to initialize logo cache:', error);
      }
    });
  }

  private async saveCache(): Promise<void> {
    try {
      this.cache.lastUpdated = new Date().toISOString();
      await fs.writeFile(this.METADATA_FILE, JSON.stringify(this.cache, null, 2));
    } catch (error) {
      console.error('Failed to save logo cache:', error);
    }
  }

  /**
   * Check if team logo needs revalidation (older than 30 days)
   */
  private needsRevalidation(teamId: string): boolean {
    const teamData = this.cache.teams[teamId];
    if (!teamData) return true;

    const downloadedAt = new Date(teamData.downloadedAt);
    const now = new Date();
    const daysSinceDownload = (now.getTime() - downloadedAt.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysSinceDownload > this.CACHE_DURATION_DAYS;
  }

  /**
   * Check if all logo files exist for a team
   */
  private async allFilesExist(teamId: string): Promise<boolean> {
    const teamDir = path.join(this.ASSETS_DIR, `team-${teamId}`);
    
    try {
      for (const size of Object.keys(this.SIZES)) {
        for (const format of this.FORMATS) {
          const filePath = path.join(teamDir, `${size}.${format}`);
          await fs.access(filePath);
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Download logo from URL
   */
  private async downloadLogo(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download logo: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Process logo into multiple sizes and formats
   */
  private async processLogo(buffer: Buffer, teamId: string): Promise<LogoMetadata> {
    const teamDir = path.join(this.ASSETS_DIR, `team-${teamId}`);
    await fs.mkdir(teamDir, { recursive: true });

    const fileSizes: LogoMetadata['fileSize'] = { large: {}, small: {} };

    // Process each size
    for (const [sizeName, dimensions] of Object.entries(this.SIZES)) {
      const resizedBuffer = await sharp(buffer)
        .resize(dimensions.width, dimensions.height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png(); // First convert to PNG as base

      // Generate each format
      for (const format of this.FORMATS) {
        const outputPath = path.join(teamDir, `${sizeName}.${format}`);
        
        let processedBuffer;
        switch (format) {
          case 'avif':
            processedBuffer = await resizedBuffer.avif({ quality: 80 });
            break;
          case 'webp':
            processedBuffer = await resizedBuffer.webp({ quality: 85 });
            break;
          case 'png':
          default:
            processedBuffer = await resizedBuffer.png({ quality: 90 });
            break;
        }

        const finalBuffer = await processedBuffer.toBuffer();
        await fs.writeFile(outputPath, finalBuffer);
        
        // Track file size
        fileSizes[sizeName as keyof typeof fileSizes][format] = finalBuffer.length;
      }
    }

    return {
      teamId,
      teamName: '', // Will be set by caller with actual team name
      originalUrl: '', // Will be set by caller
      downloadedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      sizes: this.SIZES,
      formats: [...this.FORMATS],
      fileSize: fileSizes
    };
  }

  /**
   * Get logo URLs for a team (non-blocking)
   * Environment-aware: full URLs in development, relative in production
   */
  public getLogoUrls(teamId: string): {
    large: Record<string, string>;
    small: Record<string, string>;
  } {
    // In development, use full URL with port for cross-port access
    // In production, use relative URL since frontend and backend are on same domain
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const baseUrl = isDevelopment 
      ? `http://localhost:3001/api/logos/team-${teamId}`
      : `/api/logos/team-${teamId}`;
    
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
   * Check if logo exists and is fresh
   */
  public async hasValidLogo(teamId: string): Promise<boolean> {
    if (this.needsRevalidation(teamId)) return false;
    return await this.allFilesExist(teamId);
  }

  /**
   * Process team logo in background (non-blocking)
   * This is fire-and-forget for optimal performance
   */
  public async processTeamLogoBackground(teamId: string, logoUrl: string, teamName?: string): Promise<void> {
    // Don't await this - it runs in background
    setImmediate(async () => {
      try {
        // Check if we need to process this logo
        const hasValid = await this.hasValidLogo(teamId);
        
        if (hasValid) {
          return;
        }

        // Download and process logo
        const logoBuffer = await this.downloadLogo(logoUrl);
        const metadata = await this.processLogo(logoBuffer, teamId);
        
        // Update metadata
        metadata.originalUrl = logoUrl;
        this.cache.teams[teamId] = metadata;
        await this.saveCache();
      } catch (error) {
        console.error(`[LOGO SERVICE] Failed to process logo for team ${teamId}:`, error);
      }
    });
  }

  /**
   * Get logo file path for serving
   */
  public async getLogoPath(teamId: string, size: 'large' | 'small', format: string): Promise<string | null> {
    if (!this.FORMATS.includes(format as any)) return null;

    const filePath = path.join(this.ASSETS_DIR, `team-${teamId}`, `${size}.${format}`);

    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      return null;
    }
  }

  /**
   * Check if logo exists for a team
   */
  public async hasLogo(teamId: string): Promise<boolean> {
    const logoPath = await this.getLogoPath(teamId, 'small', 'webp');
    return logoPath !== null;
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    totalTeams: number;
    totalFiles: number;
    totalSize: number;
    oldestEntry: string;
    newestEntry: string;
  } {
    const teams = Object.values(this.cache.teams);
    
    if (teams.length === 0) {
      return {
        totalTeams: 0,
        totalFiles: 0,
        totalSize: 0,
        oldestEntry: 'N/A',
        newestEntry: 'N/A'
      };
    }

    const totalFiles = teams.length * this.FORMATS.length * Object.keys(this.SIZES).length;
    const totalSize = teams.reduce((sum, team) => {
      return sum + Object.values(team.fileSize.large).reduce((a, b) => a + b, 0) +
                   Object.values(team.fileSize.small).reduce((a, b) => a + b, 0);
    }, 0);

    const dates = teams.map(t => new Date(t.downloadedAt));
    const oldestEntry = new Date(Math.min(...dates.map(d => d.getTime()))).toISOString();
    const newestEntry = new Date(Math.max(...dates.map(d => d.getTime()))).toISOString();

    return {
      totalTeams: teams.length,
      totalFiles,
      totalSize,
      oldestEntry,
      newestEntry
    };
  }
}

export const logoService = new LogoService();