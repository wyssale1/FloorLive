## Phase 3: Core Component Architecture

### Task 3.1: Reusable Game Components
**Goal**: Create flexible game display components that work across contexts

**Instructions**:
- Design GameCard component with multiple size and detail variants
- Implement LiveIndicator component with proper animations
- Create GameDetail component for individual game pages
- Build GameList component with sorting and filtering capabilities
- Ensure all components accept routing context for navigation

**Component Variants Needed**:
- Compact GameCard for lists and overviews
- Detailed GameCard for feature display
- Live GameCard with real-time indicators
- GameDetail with comprehensive match information
- Mobile-optimized layouts for all variants

**Success Criteria**:
- Single GameCard component handles all game states elegantly
- Components navigate properly using TanStack Router
- Live indicators provide clear visual feedback
- All variants are fully responsive and accessible

### Task 3.2: Navigation and Layout System
**Goal**: Create cohesive navigation that maintains URL context

**Instructions**:
- Build responsive navigation header with active state management
- Implement breadcrumb navigation for deeper pages
- Create tab navigation that updates URL parameters
- Design mobile-friendly navigation patterns
- Set up proper loading states for route transitions

**Navigation Requirements**:
- Header navigation shows current route clearly
- Tab systems (Live/Scheduled/Finished) update URL params
- Mobile navigation is touch-friendly and accessible
- Navigation maintains filter context when appropriate

**Success Criteria**:
- Navigation clearly communicates current location
- URL changes reflect all navigation actions
- Mobile navigation is intuitive and performant
- Route transitions feel instant and smooth
