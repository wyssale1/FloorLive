# Live Game Raw API Data Capture - Game 1074072

## Capture Details
- **Date**: September 12, 2025, 21:22 CEST
- **Game ID**: 1074072
- **Game URL**: `/game/1074072?tab=events`
- **Status at capture**: Currently live

## Captured API Endpoints

### 1. Overview/Games List
- **File**: `raw-api-overview-games.json`
- **API URL**: `https://api-v2.swissunihockey.ch/api/games?mode=current`
- **Size**: 1.7 KB
- **Purpose**: Shows all current games as displayed on homepage

### 2. Game Details
- **File**: `raw-api-game-details.json`  
- **API URL**: `https://api-v2.swissunihockey.ch/api/games/1074072`
- **Size**: 2.2 KB
- **Purpose**: Single game information for game detail page

### 3. Game Events
- **File**: `raw-api-game-events.json`
- **API URL**: `https://api-v2.swissunihockey.ch/api/game_events/1074072`
- **Size**: 3.9 KB
- **Purpose**: Live events, scores, timeouts, goals - crucial for live detection

## Context
This data was captured while game 1074072 was actively live to enable development and testing of:
- Live game detection logic
- Time-based live status calculation
- Event-based score parsing
- Live indicator display in overview and detail pages

## Usage
These raw API responses can be used to:
1. Test live game detection without waiting for live games
2. Debug score parsing from events
3. Analyze API response structure inconsistencies
4. Develop offline with real live game data