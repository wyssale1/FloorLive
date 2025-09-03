## Phase 2: Data Management Architecture

### Task 2.1: TanStack Query Integration
**Goal**: Implement intelligent data fetching and caching strategy

**Instructions**:
- Set up query keys structure for different data types (games, standings, teams)
- Configure cache timing appropriate for sports data (live vs. static content)
- Implement background refetching strategies for live games
- Create optimistic updates for better user experience
- Set up proper error handling and retry logic for API calls

**Cache Strategy**:
- Live games: 30-second stale time, refetch on focus
- Scheduled games: 5-minute stale time
- Standings: 1-hour stale time
- Team information: 24-hour stale time
- Historical results: Infinite stale time

**Success Criteria**:
- Data fetching feels instant through smart caching
- Live games update appropriately in background
- Network failures are handled gracefully
- Cache invalidation works properly across related queries

### Task 2.2: Mock Data Integration
**Goal**: Create comprehensive mock data system for development

**Instructions**:
- Create realistic Swiss Unihockey team and game data
- Set up mock API responses that mirror expected backend structure
- Implement different data scenarios (live games, empty states, errors)
- Create mock data that updates over time to simulate live games
- Ensure mock data covers all edge cases and loading states

**Mock Data Requirements**:
- At least 12 teams across multiple leagues
- Games in all states (scheduled, live, finished)
- Realistic scores, dates, and venue information
- Team logos and proper Swiss Unihockey branding
- Standings data with proper point calculations

**Success Criteria**:
- Mock data provides realistic development experience
- All possible app states can be tested with mock data
- Mock API responses include proper error scenarios
- Data relationships (teams, games, standings) are consistent
