# FloorLive Development Guidelines

This document contains essential context and guidelines for developing the FloorLive application, ensuring consistency across all conversations and maintaining high code quality.

## Development Principles

### DRY Principle (Don't Repeat Yourself)
- Never duplicate code, components, or logic
- Extract common functionality into reusable components
- Use shared utilities and helper functions
- Consolidate similar patterns into custom hooks

### React Patterns
- Use functional components with hooks
- Prefer composition over inheritance
- Extract custom hooks for stateful logic
- Use TypeScript interfaces for prop definitions
- Implement proper error boundaries
- Follow React best practices for performance (memo, useMemo, useCallback when needed)

### Type Safety
- **ALWAYS** use shared types from `src/shared/types/index.ts`
- Never repeat type definitions across files
- Use proper TypeScript strict mode
- Define interfaces for all component props
- Use type guards for API responses

## Project Structure

### Frontend Architecture
- **Framework**: React + TypeScript + Vite
- **Router**: TanStack Router
- **Styling**: TailwindCSS + shadcn/ui components
- **Animations**: Framer Motion
- **State Management**: React hooks + context when needed

### Directory Organization
```
frontend/src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── *.tsx           # Custom components
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and API clients
├── shared/             # Shared types and constants
│   └── types/          # TypeScript interfaces
└── assets/             # Static assets
```

### Backend Architecture
- **Framework**: Node.js + Express + TypeScript
- **API Integration**: Swiss Unihockey API client
- **Caching**: In-memory caching for API responses
- **Error Handling**: Consistent error responses

## API Integration Guidelines

### Swiss Unihockey API
- **Documentation**: https://api-v2.swissunihockey.ch/api/doc
- **Base URL**: https://api-v2.swissunihockey.ch/api
- **Authentication**: NOT REQUIRED (confirmed via email) - full API access available
- **Available Endpoints**:
  - `/games` - Game listings and details
  - `/teams/{id}` - Team information
  - `/table/{leagueId}` - League standings
  - `/games/{id}/statistics` - Game statistics
  - And many more without authentication restrictions

### API Client Patterns
- Use the centralized `apiClient.ts` for all API calls
- Implement proper error handling with user-friendly fallbacks
- Cache responses appropriately to avoid rate limiting
- Map API responses to frontend-compatible types
- Handle loading states and empty data gracefully

## Code Organization Standards

### Component Patterns
- Use descriptive component names (e.g., `GameCard`, `TeamLogo`, `LeagueTable`)
- Keep components focused on single responsibilities
- Extract complex logic into custom hooks
- Use proper prop interfaces with TypeScript
- Implement responsive design with mobile-first approach

### Custom Hooks
- `useLogo.ts` - Team logo handling with fallbacks
- `useWebSocket.ts` - Real-time game updates
- Extract stateful logic from components
- Name hooks with `use` prefix
- Return objects for multiple values

### Utility Functions
- `lib/utils.ts` - General utility functions
- `lib/apiClient.ts` - API communication layer
- `lib/mockData.ts` - Development and testing data
- Keep utilities pure and testable

### Shared Types Usage
Always import types from `src/shared/types/index.ts`:
```typescript
import { Game, Team, GameEvent } from '../shared/types'
```

Never duplicate interfaces - extend existing ones when needed:
```typescript
interface ExtendedTeam extends Team {
  additionalField: string
}
```

## Technical Context

### UI Component Library
- **shadcn/ui**: Use for consistent design system
- **Styling**: TailwindCSS utility classes
- **Responsive**: Mobile-first responsive design
- **Accessibility**: Follow ARIA guidelines

### Animation Patterns
- **Framer Motion**: Smooth page transitions and micro-interactions
- **Performance**: Use `motion.div` judiciously
- **Consistency**: Maintain consistent animation timing and easing

### Team Logo System
- Fallback hierarchy: Team logo → Swiss Unihockey logo → Initials
- Responsive sizing: small, medium, large variants
- Logo optimization with modern formats (WebP, AVIF)
- Handle missing/broken images gracefully

## Key Implementation Notes

### Route Structure
- Game details: `/game/$gameId`
- Team details: `/team/$teamId`
- Main overview: `/`
- Use TanStack Router for type-safe routing

### Tab System
- Use shadcn/ui Tabs component
- Implement lazy loading for tab content
- Handle API failures with user-friendly messages
- Maintain consistent styling across all tabs

### Error Handling
- Always provide fallback UI for failed API calls
- Log errors for debugging but show user-friendly messages
- Handle network failures gracefully
- Implement retry mechanisms where appropriate

## Development Workflow

1. Always check existing shared types before creating new ones
2. Use existing components and patterns before creating new ones
3. Test responsive design on mobile and desktop
4. Ensure proper TypeScript typing
5. Follow established naming conventions
6. Implement proper loading and error states

This document should be referenced for all development decisions to maintain consistency and code quality across the FloorLive application.