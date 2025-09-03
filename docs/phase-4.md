## Phase 4: Page Implementation with URL Management

### Task 4.1: Home Dashboard Development
**Goal**: Create engaging home page that can be bookmarked and shared

**Instructions**:
- Design hero section with current live games prominently displayed
- Create sections for today's games, upcoming matches, and quick stats
- Implement smart routing to game details and filtered views
- Add sharing functionality for interesting game combinations
- Ensure page works well with different amounts of live content

**URL Integration**:
- Home page filters should be shareable: `/?featured=live&league=nla`
- Featured games should link to proper detail pages
- All navigation preserves current context appropriately

**Success Criteria**:
- Home page immediately shows most relevant information
- All interactive elements properly update URLs
- Page can be shared to highlight specific content
- Works well across all device sizes

### Task 4.2: Games Page with Advanced Filtering
**Goal**: Comprehensive games view with shareable filtered states

**Instructions**:
- Implement tabbed interface (Live, Scheduled, Finished) with URL params
- Create comprehensive filtering system that updates URL state
- Build search functionality that maintains URL shareability
- Design date range selection with proper URL encoding
- Add sorting options that persist in URL parameters

**Filter URL Patterns**:
- `/games?tab=live&league=nla&search=zurich`
- `/games?tab=scheduled&date=2024-01-15&league=nlb`
- `/games?tab=finished&team=zsc-lions&sort=date-desc`

**Success Criteria**:
- All filter combinations create unique, shareable URLs
- Filter state is maintained across page refreshes
- Search functionality provides real-time feedback
- Mobile filtering interface is intuitive

### Task 4.3: Individual Game Pages
**Goal**: Detailed game pages with comprehensive sharing capabilities

**Instructions**:
- Create detailed game view pages with unique URLs
- Display comprehensive game information including venue, teams, stats
- Add social sharing functionality with proper meta tags
- Implement related games and team information sections
- Create proper loading and error states for missing games

**URL Structure**:
- `/games/nla-zsc-lions-vs-hc-davos-20240115` (SEO-friendly)
- `/games/12345` (Simple ID-based alternative)
- Include proper meta tags for social sharing

**Success Criteria**:
- Every game has a unique, bookmarkable URL
- Game pages include comprehensive information
- Social sharing generates proper previews
- Related content navigation works smoothly
