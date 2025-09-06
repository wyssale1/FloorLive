#!/bin/bash

# FloorLive Deployment Script
# Usage: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"

echo "🚀 Starting deployment for $ENVIRONMENT..."

# Build frontend
echo "📦 Building frontend..."
cd $FRONTEND_DIR
npm ci --legacy-peer-deps
npm run build
cd ..

# Build backend
echo "📦 Building backend..."
cd $BACKEND_DIR
npm ci
npm run build
cd ..

# Upload files (customize for your hosting setup)
echo "📤 Uploading files..."

# Example rsync command - adjust for your hosting
# rsync -avz --delete $FRONTEND_DIR/dist/ user@host:/path/to/frontend/
# rsync -avz --delete $BACKEND_DIR/dist/ user@host:/path/to/backend/
# rsync -avz $BACKEND_DIR/package*.json user@host:/path/to/backend/

# Restart application (choose one method)
echo "🔄 Restarting application..."

# Method 1: SSH restart command
# ssh user@host "cd /path/to/backend && pm2 restart floorlive"

# Method 2: Touch restart file
# ssh user@host "touch /path/to/backend/tmp/restart.txt"

# Method 3: cPanel API (if available)
# curl -X POST "https://your-cpanel-domain:2083/execute/NodeJSSelector/restart_application" \
#   -H "Authorization: cpanel user:token" \
#   -d "app_path=/path/to/your/app"

echo "✅ Deployment completed!"