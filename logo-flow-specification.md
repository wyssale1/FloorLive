# FloorLive Logo System Specification

## Overview
FloorLive uses a two-tier logo system that provides optimized performance while maintaining fallbacks for complete visual coverage.

## Core Requirements

### 1. Logo Display Contexts

#### Overview Page (Small Logos - 32x32px)
- **Primary**: Show optimized small logos when available
- **Fallback**: Show placeholder icon (Shield) - NO Swiss Unihockey logos
- **Rationale**: Clean, consistent look; performance optimized

#### Game Detail Page (Large Logos - 200x200px)  
- **Primary**: Show optimized large logos when available
- **Fallback**: Show Swiss Unihockey original logos when optimized unavailable
- **Final Fallback**: Show placeholder icon if no logos exist
- **Rationale**: Complete information display; Swiss Unihockey as reliable backup

### 2. Automatic Logo Processing

#### Trigger Event
**When**: User visits any game detail page
**What Happens**: 
1. Game data fetched from Swiss Unihockey API
2. Swiss Unihockey logo URLs extracted from API response
3. Background processing triggered (non-blocking)
4. Logos downloaded and processed into multiple formats/sizes
5. Saved to `/backend/assets/logos/team-{id}/` folder structure

#### Processing Output
**Formats**: AVIF (smallest), WebP (medium), PNG (fallback)
**Sizes**: 
- `large.{format}` - 200x200px for game detail pages
- `small.{format}` - 32x32px for overview pages

#### Team Mapping
**File**: `/backend/data/team-overrides.json`
**Structure**:
```json
{
  "TEAM_ID": {
    "mappingNames": ["Various API names", "Alternative names"],
    "displayName": "Preferred display name"
  }
}
```

### 3. Performance Characteristics

#### Browser Format Selection
1. **AVIF** - Modern browsers (smallest file size)
2. **WebP** - Widely supported (good compression)
3. **PNG** - Universal fallback (compatibility)

#### Caching Strategy
- **Optimized logos**: 30-day cache headers
- **Background processing**: Fire-and-forget (no API blocking)
- **Duplicate prevention**: Automatic checking for existing logos

## Technical Implementation

### URL Generation
- **Development**: Full URLs (`http://localhost:3001/api/logos/team-123/small.avif`)
- **Production**: Relative URLs (`/api/logos/team-123/small.avif`)

### Component Usage
```tsx
// Overview Page (GameCard)
<TeamLogo team={team} size="small" />

// Game Detail Page  
<TeamLogo team={team} size="large" showSwissUnihockeyFallback={true} />
```

### API Integration
- **Swiss Unihockey logos**: Extracted from `cells[0].image.url` and `cells[2].image.url`
- **Processing endpoint**: `POST /api/logos/test` for manual testing
- **Serving endpoint**: `GET /api/logos/team-{id}/{size}.{format}`

## Success Metrics
1. **Performance**: Optimized logos load 60-80% faster than originals
2. **Coverage**: Swiss Unihockey fallbacks ensure 100% visual coverage
3. **Automation**: Zero manual intervention required for new team logos
4. **Reliability**: Processing failures don't block user experience

## Current Status
- ✅ Logo processing and serving infrastructure
- ✅ Format optimization (AVIF/WebP/PNG)
- ✅ Cross-origin headers for development
- ⚠️ Automatic processing consistency needs verification
- ⚠️ Team name mapping accuracy needs validation

---

*This specification defines the logo system as originally conceived and implemented for FloorLive.*