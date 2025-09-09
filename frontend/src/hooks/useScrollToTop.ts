import { useEffect } from 'react'
import { useLocation } from '@tanstack/react-router'

/**
 * Hook that scrolls to top on route changes, but preserves scroll position for browser back/forward
 */
export function useScrollToTop() {
  const location = useLocation()
  
  useEffect(() => {
    // Track navigation type to distinguish between programmatic and browser navigation
    let navigationSource = 'unknown'
    
    const handlePopstate = () => {
      navigationSource = 'popstate' // Browser back/forward
    }
    
    // Listen for browser back/forward events
    window.addEventListener('popstate', handlePopstate)
    
    // Check if this is likely a programmatic navigation
    // We use a timeout to ensure the popstate listener had a chance to fire
    const timeoutId = setTimeout(() => {
      if (navigationSource !== 'popstate') {
        // This is likely a programmatic navigation (Link clicks, router.navigate, etc.)
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      }
      // Reset for next navigation
      navigationSource = 'unknown'
    }, 0)
    
    return () => {
      window.removeEventListener('popstate', handlePopstate)
      clearTimeout(timeoutId)
    }
  }, [location.pathname]) // Trigger on location changes
}