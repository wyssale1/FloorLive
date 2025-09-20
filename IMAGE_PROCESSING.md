# Image Processing Architecture

FloorLive uses a **build-time image processing** approach for optimal performance and clean separation of concerns.

## Architecture Overview

### Before (Runtime Processing)
- ❌ Images processed on server during runtime
- ❌ Background queues and job management
- ❌ Server resources used for image optimization
- ❌ Complex queue management and error handling
- ❌ Potential performance impact on live application

### After (Build-time Processing)
- ✅ Images processed locally on development machine
- ✅ Server focuses purely on serving content
- ✅ Clean separation between runtime and build concerns
- ✅ Full control over processing resources and timing
- ✅ No runtime dependencies or background jobs

## System Components

### 1. Entity Discovery (Runtime)
```
User visits team page → TTL system discovers entities → entities-master.json updated
```

The backend continues to discover and track teams/players via the TTL system, populating `backend/data/entities-master.json`.

### 2. Image Processing (Build-time)
```
npm run process-images → Downloads & optimizes images → backend/assets/ populated
```

Local script processes all entities from the master list, downloading and optimizing images.

### 3. Asset Serving (Runtime)
```
Hardcoded URLs → Fallback middleware → Processed images or placeholders
```

Backend serves processed images with intelligent fallbacks for missing assets.

### 4. Deployment (Git + CI/CD)
```
git push → GitHub Actions → Deploy only new/changed files → Production
```

## Workflow

### Development Workflow

1. **Start Development**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Discover Entities**:
   - Visit team pages in the frontend
   - Use search functionality
   - TTL system populates `entities-master.json`

3. **Process Images Locally**:
   ```bash
   # One-time setup
   npm run setup-image-processor

   # Process all images
   npm run process-images

   # Or process specific types
   npm run process-images:teams      # Only team logos
   npm run process-images:players    # Only player images
   ```

4. **Deploy Assets**:
   ```bash
   git add backend/assets/
   git commit -m "Add processed images for new entities"
   git push
   ```

### Production Deployment

GitHub Actions automatically deploys only new/changed asset files to minimize transfer time and server load.

## Technical Details

### Image Specifications

#### Player Images
- **Sizes**: Small (32x32), Medium (100x100), Large (200x200)
- **Formats**: AVIF, WebP, PNG
- **Retina**: 1x, 2x, 3x variants for high-DPI displays
- **Naming**: `{playerId}_{size}[{scale}].{format}`
- **Example**: `470887_medium2x.webp`

#### Team Logos
- **Sizes**: Small (32x32), Large (200x200)
- **Formats**: AVIF, WebP, PNG
- **Naming**: `{size}.{format}`
- **Path**: `team-{teamId}/{size}.{format}`

### Directory Structure

```
backend/assets/
├── players/
│   ├── 470887/
│   │   ├── 470887_small.avif
│   │   ├── 470887_small.webp
│   │   ├── 470887_small.png
│   │   ├── 470887_small2x.avif
│   │   ├── 470887_small2x.webp
│   │   ├── 470887_small2x.png
│   │   ├── 470887_medium.avif
│   │   ├── 470887_medium.webp
│   │   ├── 470887_medium.png
│   │   ├── 470887_large.avif
│   │   ├── 470887_large.webp
│   │   ├── 470887_large.png
│   │   └── metadata.json
│   └── [other players]/
└── logos/
    ├── team-428535/
    │   ├── small.avif
    │   ├── small.webp
    │   ├── small.png
    │   ├── large.avif
    │   ├── large.webp
    │   └── large.png
    ├── [other teams]/
    └── metadata.json
```

### Fallback System

The backend maintains intelligent fallback middleware:

1. **Requested URL**: `/assets/players/470887/profile.webp`
2. **Fallback Mapping**: `profile.webp` → `470887_medium.webp`
3. **Format Fallback**: `webp` → `avif` → `png`
4. **Final Fallback**: Transparent pixel placeholder

This ensures hardcoded URLs never return 404 errors.

## Available Commands

### Setup
```bash
cd backend
npm run setup-image-processor    # Install image processing dependencies
```

### Processing
```bash
npm run process-images           # Process all entities
npm run process-images:teams     # Process only team logos
npm run process-images:players   # Process only player images
npm run process-images:clean     # Remove all processed images
npm run process-images:force     # Reprocess existing images
npm run process-images:help      # Show all options
```

### Advanced Options
```bash
cd scripts
node image-processor.js --verbose              # Detailed output
node image-processor.js --teams-only --force   # Force reprocess teams
node image-processor.js --clean                # Clean all assets
```

## Benefits

### Performance
- ✅ **Server Performance**: No background image processing affecting response times
- ✅ **Resource Utilization**: Local machine uses full CPU/memory for processing
- ✅ **Scalability**: Server scales independently of image processing needs

### Architecture
- ✅ **Separation of Concerns**: Build vs runtime concerns properly separated
- ✅ **Reliability**: Image processing failures can't affect live application
- ✅ **Maintainability**: Clear, simple architecture without complex queue management

### Development
- ✅ **Control**: Full control over when and how images are processed
- ✅ **Debugging**: Easy to debug and iterate on image processing locally
- ✅ **Incremental**: Only process new/changed entities

### Deployment
- ✅ **Efficiency**: GitHub Actions deploy only new/changed assets
- ✅ **Predictability**: All assets available at deploy time
- ✅ **Caching**: Processed images cached in CDN/browser effectively

## Migration Notes

### What Changed
- ❌ **Removed**: `imageProcessingService.ts` and runtime queue management
- ❌ **Removed**: Image processing hooks from `backgroundEntityService.ts`
- ✅ **Added**: Local processing scripts in `/scripts/`
- ✅ **Added**: Fallback middleware for missing assets
- ✅ **Maintained**: TTL system for entity discovery
- ✅ **Maintained**: Hardcoded asset URLs in API responses

### What Stayed the Same
- Entity discovery via TTL system
- Frontend asset URL patterns
- Fallback image support
- Asset serving endpoints

## Best Practices

### When to Process Images
- After discovering new entities (visiting team pages)
- Before major deployments
- When updating image processing logic
- Periodically to catch missed entities

### Git Workflow
- Process images locally before committing
- Commit processed assets with descriptive messages
- Use `.gitattributes` for binary file handling
- Consider Git LFS for very large asset collections

### Production Considerations
- Monitor asset file sizes and repository growth
- Set up automated processing triggers if needed
- Use CDN for optimal asset delivery
- Implement asset versioning if required

## Troubleshooting

### Common Issues

1. **"Entities file not found"**
   - Solution: Run backend and visit team pages to populate entities

2. **"Failed to download image"**
   - Solution: Check internet connection and Swiss Unihockey API availability

3. **"Processing failed"**
   - Solution: Run with `--verbose` flag for detailed error information

4. **Images not showing in frontend**
   - Solution: Check fallback middleware is working and assets are committed

### Debug Commands
```bash
# Check entity discovery status
curl http://localhost:3001/api/debug/queues

# Verbose image processing
npm run process-images:help
cd scripts && node image-processor.js --verbose

# Check asset structure
ls -la backend/assets/players/
ls -la backend/assets/logos/
```

This architecture provides a clean, performant, and maintainable approach to image processing that scales with the application's needs.