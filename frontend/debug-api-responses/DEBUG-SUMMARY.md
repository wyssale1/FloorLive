# Live Game Debug Data - September 11, 2025

## Problem
- Time-based live detection works correctly (games within 3-hour window detected)
- But red live indicators not showing in overview page
- Games show `isLive: false` in GameCard even though time logic returns `shouldBeLive: true`

## Current Time Context
- Current time: 21:33 (9:33 PM)
- Games started at 20:00 (8:00 PM)
- Time difference: ~93 minutes (within 180-minute window)

## Live Games Detected Today
1. **Red Ants vs Uri** (Game ID: 1074339)
   - Status: "finished" but start_time: "Spiel läuft" 
   - Scores: 0-0
   - League: "Damen L-UPL"

2. **Krauchthal vs Skorps** (Game ID: 1072855)
   - Status: "finished" but start_time: "Spiel läuft"
   - Scores: 0-0
   - League: "Mobiliar Ligacup Frauen"

3. **Red Lions vs UH Appenzell** (Game ID: 1072848)
   - Status: "finished" but start_time: "Spiel läuft"
   - Scores: 0-0
   - League: "Mobiliar Ligacup Frauen"

## API Data Captured
- `overview-games.json` - Full games overview response
- `game-1074339-details.json` - Red Ants vs Uri game details
- `game-1074339-events.json` - Red Ants vs Uri events (5.5KB)
- `game-1072855-events.json` - Krauchthal vs Skorps events (12KB)
- `game-1072848-events.json` - Red Lions vs UH Appenzell events (9.6KB)

## Key Observations
1. **Status inconsistency**: Games have `status: "finished"` but `start_time: "Spiel läuft"`
2. **Score issue**: All games show `0-0` scores, but events contain real scores
3. **Time logic works**: Console shows `shouldBeLive: true` for these games
4. **Flow breaks somewhere**: Between time detection and UI display

## Debug Flow Added
- Full GameCard flow logging added to trace where detection breaks
- Event parsing debugging added
- Time calculation debugging added

## Next Steps for Tomorrow
1. Analyze the event JSON files to see what scores are actually available
2. Check if the issue is in the status field (`"finished"` overriding live detection)
3. Fix the GameCard flow to properly handle games with `status: "finished"` but in live time window
4. Test with the captured event data

## Time Detection Logic Implemented
- Games between start time and +3 hours (180 minutes) = potentially live
- Games with meaningful scores (not 0-0) in window = finished
- Games with 0-0 scores in window = live (fetch events for real scores)