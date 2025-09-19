import { Router } from 'express';
import { format, subDays, addDays } from 'date-fns';
import { SwissUnihockeyApiClient } from '../services/swissUnihockeyApi.js';
import { CacheService } from '../services/cacheService.js';

const router = Router();
const apiClient = new SwissUnihockeyApiClient();
const cache = new CacheService();

// Generate XML sitemap
router.get('/sitemap.xml', async (req, res) => {
  try {
    // Check cache first (cache for 1 hour)
    let sitemap = cache.get('sitemap');

    if (!sitemap) {
      sitemap = await generateSitemap();
      cache.set('sitemap', sitemap, 60 * 60 * 1000); // 1 hour cache
    }

    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

async function generateSitemap(): Promise<string> {
  const baseUrl = 'https://floorlive.ch';
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');

  // Static pages
  const staticUrls = [
    {
      loc: baseUrl,
      lastmod: today,
      changefreq: 'daily',
      priority: '1.0'
    }
  ];

  // Date-based pages (last 30 days and next 30 days)
  const dateUrls = [];
  for (let i = -30; i <= 30; i++) {
    const date = i < 0 ? subDays(now, Math.abs(i)) : addDays(now, i);
    const dateStr = format(date, 'yyyy-MM-dd');

    dateUrls.push({
      loc: `${baseUrl}?date=${dateStr}`,
      lastmod: today,
      changefreq: i === 0 ? 'hourly' : i >= -7 && i <= 7 ? 'daily' : 'weekly',
      priority: i === 0 ? '0.9' : i >= -7 && i <= 7 ? '0.8' : '0.6'
    });
  }

  try {
    // Get recent teams and games for dynamic URLs
    const recentGames = await apiClient.getGamesByDate(today);
    const teamIds = new Set<string>();
    const gameUrls: Array<{
      loc: string;
      lastmod: string;
      changefreq: string;
      priority: string;
    }> = [];

    // Collect unique team IDs and create game URLs
    recentGames.forEach(game => {
      if (game.home_team?.id) teamIds.add(game.home_team.id);
      if (game.away_team?.id) teamIds.add(game.away_team.id);

      if (game.id) {
        gameUrls.push({
          loc: `${baseUrl}/game/${game.id}`,
          lastmod: today,
          changefreq: game.status === 'live' ? 'always' : game.status === 'upcoming' ? 'daily' : 'weekly',
          priority: game.status === 'live' ? '0.9' : '0.7'
        });
      }
    });

    // Create team URLs
    const teamUrls = Array.from(teamIds).map(teamId => ({
      loc: `${baseUrl}/team/${teamId}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '0.7'
    }));

    // Combine all URLs
    const allUrls = [...staticUrls, ...dateUrls, ...gameUrls.slice(0, 100), ...teamUrls.slice(0, 50)];

    // Generate XML
    const urlEntries = allUrls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

  } catch (error) {
    console.error('Error fetching dynamic sitemap data:', error);

    // Fallback to static URLs only
    const fallbackUrls = [...staticUrls, ...dateUrls];
    const urlEntries = fallbackUrls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
  }
}

export default router;