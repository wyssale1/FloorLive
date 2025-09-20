# FloorLive Deployment Guide

This guide covers the deployment workflow for FloorLive, including the new build-time image processing system.

## Image Processing & Deployment Workflow

### 1. Development Phase

```bash
# Start backend to discover entities
cd backend
npm run dev

# Visit team pages in frontend to populate entities-master.json
# This happens automatically via the TTL system
```

### 2. Local Image Processing

```bash
# Process all discovered entities
npm run process-images

# Or process specific types
npm run process-images:teams      # Only team logos
npm run process-images:players    # Only player images

# Force reprocess existing images
npm run process-images:force
```

### 3. Commit Processed Assets

```bash
# Add new processed images to git
git add backend/assets/

# Commit with descriptive message
git commit -m "Add processed images for newly discovered entities"

# Push to trigger deployment
git push origin main
```

### 4. Automatic Deployment

GitHub Actions automatically:
- ✅ **Builds** frontend and backend
- ✅ **Includes** all processed images in deployment
- ✅ **Uploads only changed files** (incremental deployment)
- ✅ **Restarts** backend application

## Git Configuration Changes

The following files have been updated to include processed images in the repository:

### `.gitignore` - Updated to include processed images
- ❌ **Removed**: `backend/assets/*` (was excluding all assets)
- ✅ **Added**: Specific exclusions for temporary files only
- ✅ **Result**: Processed images are now tracked in git

### `.gitattributes` - New file for binary handling
- ✅ **Binary files**: Properly marked as binary (*.png, *.webp, *.avif)
- ✅ **Text files**: metadata.json treated as text for better diffs
- ✅ **Performance**: Optimized git handling of image files

### GitHub Actions - Updated for incremental deployment
- ✅ **Incremental uploads**: Only changed files uploaded via FTP
- ✅ **State tracking**: Uses `state-name` for change detection
- ✅ **Excludes**: Temporary files and system files excluded
- ✅ **Logging**: Verbose logging shows which files are uploaded

## Benefits of This Approach

### Network Efficiency
- **Incremental uploads**: Only new/changed files transferred
- **Smart deployment**: GitHub Actions tracks what changed
- **Bandwidth savings**: Avoid re-uploading unchanged images

### Development Workflow
- **Local control**: Process images when convenient
- **Git tracking**: Full history of image changes
- **Automated deployment**: Push to deploy, no manual steps

### Performance
- **No runtime processing**: Server focuses on serving content
- **Predictable uploads**: Only new entities require new images
- **Efficient storage**: Modern image formats with optimal compression

## Next Steps

1. **Run image processing**: `npm run process-images`
2. **Commit assets**: `git add backend/assets/ && git commit -m "Add processed images"`
3. **Deploy**: `git push origin main`

The deployment will now handle your processed images efficiently, uploading only what's new or changed! 🚀