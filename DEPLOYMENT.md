# FloorLive Deployment Guide

This document explains the deployment setup for FloorLive, including automatic Node.js application restart in cPanel.

## GitHub Actions Deployment

The project uses GitHub Actions to automatically deploy both frontend and backend when code is pushed to the `main` branch.

### Deployment Flow

1. **Frontend Deployment**: Builds React app and deploys via FTP to `/public_html/floorlive_frontend/`
2. **Backend Deployment**: Builds TypeScript to JavaScript and deploys via FTP to `/app/floorlive_backend/`
3. **Auto-Restart**: Automatically restarts the Node.js application in cPanel using SSH

## Required GitHub Secrets

To enable automatic deployment and Node.js app restart, configure these secrets in your GitHub repository:

### Existing FTP Secrets
- `FTP_SERVER`: Your cPanel FTP server hostname
- `FTP_USERNAME`: Your cPanel FTP username
- `FTP_PASSWORD`: Your cPanel FTP password

### New SSH Secrets (for auto-restart)
- `CPANEL_HOST`: Your cPanel server hostname - `srv9.tophost.ch` (extracted from your cPanel URL)
- `CPANEL_USERNAME`: Your cPanel username
- `CPANEL_SSH_KEY`: Private SSH key for authentication (see setup below)

## SSH Key Setup

To enable automatic Node.js application restart, you need to set up SSH key authentication:

### 1. Generate SSH Key Pair
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/cpanel_deploy_key
```

### 2. Add Public Key to cPanel
1. Log into cPanel
2. Go to "SSH Access" or "Terminal"
3. Add the public key content to `~/.ssh/authorized_keys`:
   ```bash
   cat ~/.ssh/cpanel_deploy_key.pub >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

### 3. Add Private Key to GitHub Secrets
1. Copy the private key content:
   ```bash
   cat ~/.ssh/cpanel_deploy_key
   ```
2. In GitHub repository: Settings → Secrets and variables → Actions
3. Add new secret `CPANEL_SSH_KEY` with the private key content

## Node.js Application Restart

The deployment workflow uses CloudLinux's Node.js Selector to restart the application:

```bash
cloudlinux-selector restart --json --interpreter nodejs --app-root ~/app/floorlive_backend
```

This command:
- Restarts the Node.js application in cPanel
- Uses the CloudLinux Node.js Selector (standard in most cPanel hosting)
- Outputs JSON format for better error handling
- Points to the correct application root directory

## Troubleshooting

### SSH Connection Issues
- Ensure SSH access is enabled in cPanel
- Verify the SSH key is correctly added to `~/.ssh/authorized_keys`
- Use `srv9.tophost.ch` as your `CPANEL_HOST` (from your cPanel URL: https://srv9.tophost.ch:2083/...)
- SSH typically uses port 22, not 2083 (which is for cPanel web interface)

### Application Restart Issues
- Verify CloudLinux Node.js Selector is available on your hosting
- Check that the app path `~/app/floorlive_backend` is correct
- Ensure the Node.js application is properly configured in cPanel

### Alternative Restart Methods
If CloudLinux selector is not available, you can modify the SSH script to use:
```bash
# Alternative: Direct application restart
cd ~/app/floorlive_backend && npm run start
```

## Manual Deployment

If automated deployment fails, you can manually:

1. **Frontend**: Build with `npm run build` and upload `dist/` contents to `/public_html/floorlive_frontend/`
2. **Backend**: Build with `npm run build` and upload `dist/`, `package.json`, and `assets/` to `/app/floorlive_backend/`
3. **Restart**: Use cPanel Node.js interface to restart the application

## Domain Configuration

The application is configured for production domain `floorlive.ch`:
- Frontend: Served from cPanel's public_html directory
- Backend: Runs as Node.js application with API endpoints at `/api`
- WebSocket: Configured for `wss://floorlive.ch/api`