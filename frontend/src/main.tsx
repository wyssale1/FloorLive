import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, createRootRoute, createRoute, RouterProvider, Outlet } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import Home from './pages/Home'
import GameDetail from './pages/GameDetail'
import TeamDetail from './pages/TeamDetail'
import Header from './components/Header'

const queryClient = new QueryClient()

// Step 1: Create a root route with Header + Outlet
const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-gray-50/30">
      <Header />
      <Outlet />
    </div>
  ),
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

// Step 5: Create the route tree
const routeTree = rootRoute.addChildren([indexRoute, gameRoute, teamRoute])

// Step 6: Create the router
const router = createRouter({ routeTree })

// Step 7: Register for TypeScript
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
