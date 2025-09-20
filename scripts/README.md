# FloorLive Local Image Processing

This directory contains local image processing scripts that handle downloading and optimizing player images and team logos for the FloorLive application.

## Overview

Image processing has been moved from runtime to build-time for better performance and architecture:

- **Runtime**: Backend focuses on serving data and API responses
- **Build-time**: Local machine handles resource-intensive image processing
- **Deployment**: Processed assets are committed to git and deployed via GitHub Actions

## Setup

1. **Install dependencies:**
   ```bash
   cd scripts/
   npm install
   ```

2. **Ensure entities are discovered:**
   - Run the backend application
   - Visit team pages or use search functionality
   - This populates `backend/data/entities-master.json` with teams and players

## Usage

### Process All Images
```bash
npm run process
```
Downloads and processes all team logos and player images from entities-master.json.

### Process Teams Only
```bash
npm run process-teams
```
Processes only team logos (faster for team-focused updates).

### Process Players Only
```bash
npm run process-players
```
Processes only player images (useful for large team rosters).

### Clean All Assets
```bash
npm run clean
```
Removes all existing processed images (useful for fresh start).

### Command Line Options

```bash
node image-processor.js [options]

Options:
  --teams-only, -t    Process only team logos
  --players-only, -p  Process only player images
  --clean, -c         Clean all existing assets
  --force, -f         Force reprocess existing images
  --verbose, -v       Verbose output
  --help, -h          Show help
```

## Output Structure

### Team Logos
```
backend/assets/logos/
├── team-428535/
│   ├── small.avif
│   ├── small.webp
│   ├── small.png
│   ├── large.avif
│   ├── large.webp
│   └── large.png
└── metadata.json
```

### Player Images
```
backend/assets/players/
├── 470887/
│   ├── 470887_small.avif
│   ├── 470887_small.webp
│   ├── 470887_small.png
│   ├── 470887_small2x.avif     # Retina 2x
│   ├── 470887_small2x.webp
│   ├── 470887_small2x.png
│   ├── 470887_small3x.avif     # Retina 3x
│   ├── 470887_small3x.webp
│   ├── 470887_small3x.png
│   ├── 470887_medium.avif
│   ├── 470887_medium.webp
│   ├── 470887_medium.png
│   ├── 470887_medium2x.avif    # Retina 2x
│   ├── 470887_medium2x.webp
│   ├── 470887_medium2x.png
│   ├── 470887_large.avif
│   ├── 470887_large.webp
│   ├── 470887_large.png
│   └── metadata.json
```

## Image Specifications

### Sizes
- **Small**: 32x32px (UI thumbnails)
- **Medium**: 100x100px (cards, lists)
- **Large**: 200x200px (detail pages)

### Formats
- **AVIF**: Modern format, best compression
- **WebP**: Good compression, wide support
- **PNG**: Fallback format, universal support

### Retina Support
- **1x**: Standard resolution
- **2x**: High-DPI displays (Retina)
- **3x**: Ultra high-DPI displays

## Workflow

1. **Development**:
   - Backend discovers new entities via TTL system
   - Entities saved to `entities-master.json`

2. **Local Processing**:
   - Run `npm run process` locally
   - Images downloaded and optimized
   - Assets saved to `/backend/assets/`

3. **Deployment**:
   - Commit processed assets to git
   - Push to GitHub
   - GitHub Actions deploys only new/changed files

## Performance Notes

- **Rate Limiting**: 500ms delay between API requests
- **Concurrent Processing**: Processes one entity at a time to avoid overwhelming Swiss Unihockey API
- **Incremental**: Only processes missing images (use `--force` to reprocess)
- **Efficient**: Local processing uses full system resources

## Error Handling

- **Network failures**: Retry with exponential backoff
- **Invalid images**: Skip and continue processing
- **API errors**: Log error and continue with next entity
- **Detailed logging**: Shows progress and issues

## Integration with Backend

The backend maintains fallback middleware that serves placeholder images when processed assets don't exist yet, ensuring the application never shows broken images.

## Git Considerations

- Processed images are committed to the repository
- Use `.gitattributes` to handle binary files properly
- Consider Git LFS for very large asset collections
- GitHub Actions can deploy only changed files to minimize transfer

## Troubleshooting

### Common Issues

1. **"Entities file not found"**
   - Run the backend and visit some team pages to populate entities

2. **"Failed to download image"**
   - Check internet connection
   - Swiss Unihockey API might be temporarily unavailable

3. **"Sharp processing error"**
   - Ensure Sharp dependencies are installed correctly
   - Some source images might be corrupted

### Debug Mode
```bash
node image-processor.js --verbose
```
Shows detailed processing information for troubleshooting.