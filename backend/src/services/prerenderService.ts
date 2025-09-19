// import puppeteer from 'puppeteer';
import { format, addDays, subDays } from 'date-fns';
import { CacheService } from './cacheService.js';
import fs from 'fs/promises';
import path from 'path';

export class PrerenderService {
  private cache = new CacheService();
  private baseUrl: string;
  private outputDir: string;

  constructor(baseUrl = 'http://localhost:5173', outputDir = './prerendered') {
    this.baseUrl = baseUrl;
    this.outputDir = outputDir;
  }

  /**
   * Prerender critical pages for SEO
   */
  async prerenderCriticalPages(): Promise<void> {
    console.log('🎭 Prerendering disabled - puppeteer not available');
    return;
    /*
    console.log('🎭 Starting prerendering process...');

    try {
      await this.ensureOutputDirectory();
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const criticalRoutes = this.getCriticalRoutes();

      for (const route of criticalRoutes) {
        try {
          await this.prerenderPage(browser, route.path, route.filename);
          console.log(`✅ Prerendered: ${route.path}`);
        } catch (error) {
          console.error(`❌ Failed to prerender ${route.path}:`, error);
        }
      }

      await browser.close();
      console.log('🎭 Prerendering completed');
    } catch (error) {
      console.error('🚨 Prerendering service failed:', error);
    }
    */
  }

  /**
   * Get list of critical routes to prerender
   */
  private getCriticalRoutes(): Array<{ path: string; filename: string }> {
    const today = new Date();
    const routes = [
      { path: '/', filename: 'index.html' },
      { path: `/?date=${format(today, 'yyyy-MM-dd')}`, filename: 'today.html' }
    ];

    // Add past 7 days and next 7 days
    for (let i = -7; i <= 7; i++) {
      if (i === 0) continue; // Already added today
      const date = i < 0 ? subDays(today, Math.abs(i)) : addDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      routes.push({
        path: `/?date=${dateStr}`,
        filename: `date-${dateStr}.html`
      });
    }

    return routes;
  }

  /**
   * Prerender a single page
   */
  private async prerenderPage(browser: any, route: string, filename: string): Promise<void> {
    const page = await browser.newPage();

    try {
      // Set a realistic viewport
      await page.setViewport({ width: 1280, height: 720 });

      // Navigate to the page
      const url = `${this.baseUrl}${route}`;
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Wait for React to render
      await page.waitForSelector('[data-testid="content"], .container', { timeout: 10000 });

      // Get the fully rendered HTML
      const html = await page.content();

      // Enhance the HTML for SEO
      const enhancedHtml = this.enhanceHtmlForSEO(html, route);

      // Save to file
      const filePath = path.join(this.outputDir, filename);
      await fs.writeFile(filePath, enhancedHtml, 'utf8');

      // Cache the result for serving
      this.cache.set(`prerender:${route}`, enhancedHtml, 24 * 60 * 60 * 1000); // 24 hours

    } finally {
      await page.close();
    }
  }

  /**
   * Enhance HTML for better SEO
   */
  private enhanceHtmlForSEO(html: string, route: string): string {
    // Add meta tags if missing
    let enhanced = html;

    // Add canonical URL
    const canonicalUrl = `https://floorlive.ch${route}`;
    if (!enhanced.includes('<link rel="canonical"')) {
      enhanced = enhanced.replace(
        '</head>',
        `  <link rel="canonical" href="${canonicalUrl}" />\n</head>`
      );
    }

    // Add lastmod meta tag
    const lastmod = new Date().toISOString();
    enhanced = enhanced.replace(
      '</head>',
      `  <meta name="lastmod" content="${lastmod}" />\n</head>`
    );

    // Add prerendered indicator
    enhanced = enhanced.replace(
      '</head>',
      `  <meta name="prerendered" content="true" />\n  <meta name="prerender-date" content="${lastmod}" />\n</head>`
    );

    return enhanced;
  }

  /**
   * Get prerendered content if available
   */
  async getPrerenderedContent(route: string): Promise<string | null> {
    return this.cache.get(`prerender:${route}`);
  }

  /**
   * Ensure output directory exists
   */
  private async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.access(this.outputDir);
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true });
    }
  }

  /**
   * Serve prerendered content if available, otherwise serve SPA
   */
  static middleware() {
    return async (req: any, res: any, next: any) => {
      // Only prerender for GET requests and bots
      if (req.method !== 'GET') {
        return next();
      }

      const userAgent = req.get('User-Agent') || '';
      const isBot = /bot|crawler|spider|scraper|facebookexternalhit|twitterbot|linkedinbot|whatsapp/i.test(userAgent);

      if (!isBot) {
        return next();
      }

      const prerenderService = new PrerenderService();
      const prerenderedContent = await prerenderService.getPrerenderedContent(req.path);

      if (prerenderedContent) {
        res.set('Content-Type', 'text/html');
        res.set('X-Prerendered', 'true');
        return res.send(prerenderedContent);
      }

      next();
    };
  }
}

// Create global instance
export const prerenderService = new PrerenderService();