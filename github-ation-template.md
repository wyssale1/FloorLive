name: Deploy Frontend & Backend

on:
  push:
    branches:
      - main   # deploy when pushing to main

jobs:
  frontend:
    name: Deploy Frontend
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install & Build Frontend
        run: |
          cd frontend
          npm ci
          npm run build

      - name: Deploy Frontend via FTP
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./frontend/dist
          server-dir: /public_html/

  backend:
    name: Deploy Backend
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install Backend & Build (TypeScript → JS)
        run: |
          cd backend
          npm ci
          npm run build    # assumes your package.json has "build": "tsc"
          mkdir -p ../backend-dist
          cp -r build ../backend-dist   # compiled JS (tsc outDir=build)
          cp package*.json ../backend-dist

      - name: Deploy Backend via SSH
        uses: appleboy/ssh-action@v1.1.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          password: ${{ secrets.SSH_PASSWORD }}   # OR use key: ${{ secrets.SSH_KEY }}
          script: |
            mkdir -p ~/apps/floorlive-backend
        env:
          SRC: ./backend-dist/
          DEST: ~/apps/floorlive-backend/

      - name: Upload Backend Files
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          password: ${{ secrets.SSH_PASSWORD }}
          source: "backend-dist/*"
          target: "~/apps/floorlive-backend"

      - name: Install Production Dependencies & Restart
        uses: appleboy/ssh-action@v1.1.0
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          password: ${{ secrets.SSH_PASSWORD }}
          script: |
            cd ~/apps/floorlive-backend
            npm ci --production
            touch tmp/restart.txt || true