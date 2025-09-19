import { format } from 'date-fns';
import { SwissUnihockeyApiClient } from './swissUnihockeyApi.js';
import { CacheService } from './cacheService.js';

export class SEOService {
  private apiClient = new SwissUnihockeyApiClient();
  private cache = new CacheService();
  private baseUrl = 'https://floorlive.ch';

  /**
   * Generate dynamic meta tags for specific routes
   */
  async generateMetaTags(route: string, params?: Record<string, string>): Promise<string> {
    const cacheKey = `seo:${route}:${JSON.stringify(params)}`;
    let metaTags = this.cache.get<string>(cacheKey);

    if (!metaTags) {
      metaTags = await this.buildMetaTags(route, params);
      this.cache.set(cacheKey, metaTags, 60 * 60 * 1000); // 1 hour cache
    }

    return metaTags;
  }

  /**
   * Build meta tags based on route and parameters
   */
  private async buildMetaTags(route: string, params?: Record<string, string>): Promise<string> {
    try {
      if (route === '/') {
        return await this.buildHomePageMeta(params?.date);
      } else if (route.startsWith('/game/')) {
        return await this.buildGamePageMeta(params?.gameId);
      } else if (route.startsWith('/team/')) {
        return await this.buildTeamPageMeta(params?.teamId);
      }
    } catch (error) {
      console.error('Error building meta tags:', error);
    }

    return this.buildDefaultMeta();
  }

  /**
   * Build meta tags for home page
   */
  private async buildHomePageMeta(date?: string): Promise<string> {
    const targetDate = date || format(new Date(), 'yyyy-MM-dd');

    try {
      const games = await this.apiClient.getGamesByDate(targetDate);
      const gameCount = games.length;
      const liveGames = games.filter(g => g.status === 'live').length;

      const title = `Swiss Unihockey Results ${targetDate} - ${gameCount} Games${liveGames ? ` (${liveGames} Live)` : ''} | FloorLive`;
      const description = `Swiss Unihockey games and live scores for ${targetDate}. ${gameCount} games scheduled${liveGames ? `, ${liveGames} currently live` : ''}. Follow NLA, NLB teams and players on FloorLive.`;

      return this.buildMetaTagsHTML({
        title,
        description,
        url: `${this.baseUrl}${date ? `?date=${date}` : ''}`,
        type: 'website',
        keywords: `swiss unihockey, floorball, ${targetDate}, live scores, NLA, NLB, results`
      });
    } catch (error) {
      console.error('Error building home page meta:', error);
      return this.buildDefaultMeta();
    }
  }

  /**
   * Build meta tags for game page
   */
  private async buildGamePageMeta(gameId?: string): Promise<string> {
    if (!gameId) return this.buildDefaultMeta();

    try {
      const game = await this.apiClient.getGameDetails(gameId);
      if (!game) return this.buildDefaultMeta();

      const homeTeam = game.home_team?.name || 'Home';
      const awayTeam = game.away_team?.name || 'Away';
      const score = game.home_score !== null && game.away_score !== null
        ? ` ${game.home_score}-${game.away_score}`
        : '';

      const statusText = game.status === 'live' ? ' - Live Now'
        : game.status === 'finished' ? ' - Final'
        : '';

      const title = `${homeTeam} vs ${awayTeam}${score}${statusText} | Swiss Unihockey | FloorLive`;
      const description = `Follow the Swiss Unihockey match between ${homeTeam} and ${awayTeam}${score ? ` with score ${score}` : ''}${game.status === 'live' ? ' live now' : ''}. Live updates, statistics, and game timeline on FloorLive.`;

      return this.buildMetaTagsHTML({
        title,
        description,
        url: `${this.baseUrl}/game/${gameId}`,
        type: 'article',
        keywords: `${homeTeam}, ${awayTeam}, swiss unihockey, game, ${game.status}, floorball`
      });
    } catch (error) {
      console.error('Error building game page meta:', error);
      return this.buildDefaultMeta();
    }
  }

  /**
   * Build meta tags for team page
   */
  private async buildTeamPageMeta(teamId?: string): Promise<string> {
    if (!teamId) return this.buildDefaultMeta();

    try {
      const team = await this.apiClient.getTeamDetails(teamId);
      if (!team) return this.buildDefaultMeta();

      const title = `${team.name} - Team Profile | Swiss Unihockey | FloorLive`;
      const description = `View ${team.name} team profile, players, statistics, and upcoming games. Swiss Unihockey team information and live scores on FloorLive.`;

      return this.buildMetaTagsHTML({
        title,
        description,
        url: `${this.baseUrl}/team/${teamId}`,
        type: 'profile',
        keywords: `${team.name}, swiss unihockey, team, players, statistics, floorball`
      });
    } catch (error) {
      console.error('Error building team page meta:', error);
      return this.buildDefaultMeta();
    }
  }

  /**
   * Build default meta tags
   */
  private buildDefaultMeta(): string {
    return this.buildMetaTagsHTML({
      title: 'FloorLive - Swiss Unihockey Live Scores & Results',
      description: 'Follow live Swiss Unihockey games, scores, and results. Track NLA, NLB teams and players. Real-time updates for all Swiss Unihockey matches.',
      url: this.baseUrl,
      type: 'website',
      keywords: 'swiss unihockey, floorball, live scores, NLA, NLB, results'
    });
  }

  /**
   * Build HTML meta tags string
   */
  private buildMetaTagsHTML(options: {
    title: string;
    description: string;
    url: string;
    type: string;
    keywords: string;
    image?: string;
  }): string {
    const { title, description, url, type, keywords, image = `${this.baseUrl}/icons/apple-touch-icon-180x180.png` } = options;

    return `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="keywords" content="${keywords}" />
    <link rel="canonical" href="${url}" />

    <!-- Open Graph -->
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:site_name" content="FloorLive" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />

    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "${title}",
      "description": "${description}",
      "url": "${url}",
      "publisher": {
        "@type": "Organization",
        "name": "FloorLive",
        "url": "${this.baseUrl}"
      }
    }
    </script>`.trim();
  }

  /**
   * Express middleware for SEO meta injection for bots
   */
  static middleware() {
    const seoService = new SEOService();

    return async (req: any, res: any, next: any) => {
      const userAgent = req.get('User-Agent') || '';
      const isBot = /bot|crawler|spider|scraper|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram/i.test(userAgent);

      // Only process for bots on HTML requests
      if (!isBot || !req.accepts('html')) {
        return next();
      }

      try {
        // Extract route and params
        const route = req.path;
        const params: Record<string, string> = {};

        if (route.startsWith('/game/')) {
          params.gameId = req.params.gameId || route.split('/')[2];
        } else if (route.startsWith('/team/')) {
          params.teamId = req.params.teamId || route.split('/')[2];
        } else if (route === '/' && req.query.date) {
          params.date = req.query.date as string;
        }

        // Generate meta tags
        const metaTags = await seoService.generateMetaTags(route, params);

        // Inject meta tags into the response
        res.set('X-SEO-Enhanced', 'true');

        // For now, just serve the enhanced meta in a basic HTML structure
        // In production, you'd want to inject into your SPA's HTML
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${metaTags}
</head>
<body>
    <div id="root">
        <h1>FloorLive - Swiss Unihockey Tracker</h1>
        <p>Live scores and results for Swiss Unihockey games.</p>
        <p>Please enable JavaScript to view the full application.</p>
    </div>
</body>
</html>`;

        return res.send(html);
      } catch (error) {
        console.error('SEO middleware error:', error);
        return next();
      }
    };
  }
}

export const seoService = new SEOService();