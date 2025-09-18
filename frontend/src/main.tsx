import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, createRootRoute, createRoute, RouterProvider, Outlet } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import Home from './pages/Home'
import GameDetail from './pages/GameDetail'
import TeamDetail from './pages/TeamDetail'
import PlayerDetail from './pages/PlayerDetail'
import Rankings from './pages/Rankings'
import NotFound from './pages/NotFound'
import Header from './components/Header'
import ErrorBoundary from './components/ErrorBoundary'
import { MenuProvider } from './contexts/MenuContext'
import { useScrollToTop } from './hooks/useScrollToTop'

const queryClient = new QueryClient()

// Root component with scroll management
function RootComponent() {
  useScrollToTop()

  return (
    <ErrorBoundary>
      <MenuProvider>
        <div className="min-h-screen bg-gray-50/30">
          <Header />
          <Outlet />
        </div>
      </MenuProvider>
    </ErrorBoundary>
  )
}

// Step 1: Create a root route with Header + Outlet wrapped in ErrorBoundary
const rootRoute = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
})

// Step 2: Create index route (home page) with search params
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      date: typeof search.date === 'string' ? search.date : undefined,
    }
  },
})

// Step 3: Create game detail route
const gameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/game/$gameId',
  component: GameDetail,
})

// Step 4: Create team detail route
const teamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/team/$teamId',
  component: TeamDetail,
})

// Step 5: Create player detail route
const playerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/player/$playerId',
  component: PlayerDetail,
})

// Step 6: Create rankings route
const rankingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rankings',
  component: Rankings,
})

// Step 7: Create the route tree
const routeTree = rootRoute.addChildren([indexRoute, gameRoute, teamRoute, playerRoute, rankingsRoute])

// Step 8: Create the router with scroll management
const router = createRouter({ 
  routeTree,
  defaultPreload: 'intent',
})

// Step 9: Register for TypeScript
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
