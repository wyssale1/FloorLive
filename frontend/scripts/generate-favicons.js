import { favicons } from 'favicons';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../public');
const iconsDir = join(publicDir, 'icons');
const logoPath = join(publicDir, 'logo.svg');

// Configuration for favicon generation
const configuration = {
  path: "/icons/", // Path for browsers to find icons
  appName: "FloorLive",
  appShortName: "FloorLive",
  appDescription: "Live Swiss Unihockey games tracking and scores",
  developerName: "FloorLive Team",
  developerURL: null,
  dir: "auto",
  lang: "en-US",
  background: "#ffffff",
  theme_color: "#3754fa",
  appleStatusBarStyle: "default",
  display: "standalone",
  orientation: "portrait",
  scope: "/",
  start_url: "/",
  preferRelatedApplications: false,
  relatedApplications: undefined,
  version: "1.0",
  logging: false,
  pixel_art: false,
  loadManifestWithCredentials: false,
  manifestMaskable: false,
  icons: {
    android: true,
    appleIcon: true,
    appleStartup: true,
    coast: false,
    favicons: true,
    windows: true,
    yandex: false
  }
};

async function generateFavicons() {
  try {
    console.log('🎨 Generating favicons from logo.svg...');
    
    // Ensure icons directory exists
    await fs.mkdir(iconsDir, { recursive: true });
    
    // Read the source logo
    const source = await fs.readFile(logoPath);
    
    // Generate favicons
    const response = await favicons(source, configuration);
    
    // Save all generated files
    await Promise.all([
      ...response.images.map(async (image) => {
        await fs.writeFile(join(iconsDir, image.name), image.contents);
      }),
      ...response.files.map(async (file) => {
        await fs.writeFile(join(iconsDir, file.name), file.contents);
      })
    ]);
    
    console.log('✅ Generated', response.images.length, 'favicon images');
    console.log('✅ Generated', response.files.length, 'manifest files');
    
    // Output HTML tags for reference
    console.log('\n📋 HTML tags to add to index.html:');
    response.html.forEach(tag => console.log(tag));
    
    console.log('\n🎉 Favicon generation complete!');
    
  } catch (error) {
    console.error('❌ Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();