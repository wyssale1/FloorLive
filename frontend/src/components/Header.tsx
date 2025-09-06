import { Link, useLocation } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { useEasterEggStore } from '../stores'
import Crown from './Crown'

// SVG Logo Component - inline for performance
const Logo = ({ className }: { className?: string }) => (
  <svg 
    data-name="Ebene 1" 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 37.32 40"
    className={className}
  >
    <defs>
      <style>{`.cls-1 { fill: #3754fa; }`}</style>
    </defs>
    <path className="cls-1" d="M7.61,2.51C11.04.61,14.95-.24,18.86.06c3.91.3,7.64,1.75,10.74,4.16,3.09,2.41,5.41,5.67,6.66,9.39,1.25,3.72,1.39,7.72.38,11.51l-.2.71c-1.07,3.51-3.08,6.66-5.82,9.11l-.56.48c-2.82,2.34-6.24,3.86-9.88,4.39l-.73.09c-2.46.27-4.94.07-7.32-.57l3.42-3.42c1.34.15,2.71.13,4.06-.07,3.1-.45,6.01-1.8,8.35-3.89,2.34-2.09,4.02-4.82,4.82-7.85.75-2.84.71-5.83-.13-8.65l-.18-.56c-1-2.97-2.86-5.58-5.33-7.51-2.32-1.81-5.09-2.94-8-3.27l-.59-.06c-3.13-.24-6.26.44-9,1.96-1.83,1.01-3.43,2.37-4.72,3.99H0c1.81-3.13,4.44-5.72,7.61-7.49Z"/>
    <path className="cls-1" d="M10.71,7.65c2.3-1.23,4.91-1.79,7.52-1.62,2.61.17,5.12,1.07,7.24,2.59,2.12,1.52,3.78,3.61,4.78,6.02,1,2.41,1.3,5.06.88,7.64-.43,2.58-1.56,4.99-3.29,6.95-1.72,1.96-3.96,3.41-6.46,4.17l-.47.13c-1.13.3-2.29.45-3.45.46l6.73-6.73c.22-.21.44-.44.65-.67,1.23-1.4,2.05-3.13,2.35-4.97.3-1.84.09-3.73-.63-5.46-.71-1.73-1.9-3.22-3.42-4.3l-.29-.2c-1.45-.97-3.14-1.54-4.89-1.65l-.35-.02c-.16,0-.31,0-.47,0H7.52c.94-.92,2.02-1.72,3.19-2.34Z"/>
    <path className="cls-1" d="M8.51,31.65c-.43.43-.37,1.15.13,1.51.39.28.93.24,1.28-.11l10.22-10.22c1.57-1.57,1.57-4.11,0-5.67-.75-.75-1.77-1.17-2.84-1.17H6.13c-.45,0-.84.29-.97.72-.19.64.29,1.29.97,1.29h10.6c2,0,3.01,2.43,1.59,3.85l-9.8,9.8ZM12.74,35.88c-1.73,1.72-4.44,1.95-6.43.53-2.51-1.79-2.81-5.41-.63-7.59l6.82-6.82h-6.38c-3.34,0-5.74-3.22-4.8-6.42.63-2.13,2.58-3.59,4.8-3.59h11.17c2.12,0,4.16.84,5.66,2.35,3.13,3.13,3.13,8.2,0,11.33l-10.22,10.22Z"/>
  </svg>
)

// Hook to determine if back button should be shown
const useBackButton = () => {
  const location = useLocation()
  
  // Check if user has navigated within the app
  const hasNavigated = sessionStorage.getItem('hasNavigated') === 'true'
  
  // Set navigation flag when user navigates (but not on initial load)
  useEffect(() => {
    const handleNavigation = () => {
      sessionStorage.setItem('hasNavigated', 'true')
    }
    
    // Only set flag after a small delay to avoid setting it on initial page load
    const timer = setTimeout(() => {
      // Listen for any navigation events
      window.addEventListener('popstate', handleNavigation)
      
      // Navigation tracking is handled by the navigation itself triggering useEffect
    }, 100)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('popstate', handleNavigation)
    }
  }, [])
  
  // Mark as navigated when location changes (client-side navigation)
  useEffect(() => {
    if (location.pathname !== '/') {
      sessionStorage.setItem('hasNavigated', 'true')
    }
  }, [location.pathname])
  
  // Only show back button if not on home page AND user has navigated within app
  const shouldShow = location.pathname !== '/' && hasNavigated
  
  const goBack = () => {
    window.history.back()
  }
  
  return { shouldShow, goBack }
}

export default function Header() {
  const { shouldShow, goBack } = useBackButton()
  const { crownUnlocked } = useEasterEggStore()
  
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left Section - Dynamic Back Button */}
        <div className="flex items-center w-20">
          <AnimatePresence mode="wait">
            {shouldShow && (
              <motion.button
                key="back-button"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                onClick={goBack}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors p-2 -ml-2 rounded-lg hover:bg-gray-50"
                aria-label="Go back"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Center Section - Logo + Brand */}
        <Link 
          to="/" 
          search={{ date: undefined }}
          className="flex items-center space-x-2 transition-opacity"
        >
          <div className="relative">
            <Logo className="h-5 w-5" />
            {crownUnlocked && <Crown />}
          </div>
          <div className="text-xl font-medium text-gray-900 tracking-tight relative">
            {crownUnlocked ? (
              <div className="flex items-center">
                <span>Floor</span>
                <div className="relative inline-block">
                  {/* Greyish "Live" */}
                  <span className="text-gray-300">
                    Live
                  </span>
                  {/* "King" text appearing directly over "Live" */}
                  <motion.span 
                    className="absolute -top-0.5 left-0 text-yellow-500 font-bold text-xl"
                    initial={{ 
                      opacity: 0, 
                      scale: 0.8,
                      rotate: 0
                    }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1.1,
                      rotate: -8
                    }}
                    transition={{ 
                      delay: 0.3, 
                      type: "spring", 
                      damping: 15, 
                      stiffness: 300 
                    }}
                    style={{
                      textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                    }}
                  >
                    King
                  </motion.span>
                </div>
              </div>
            ) : (
              <span>FloorLive</span>
            )}
          </div>
        </Link>

        {/* Right Section - Placeholder for future actions */}
        <div className="w-20 flex justify-end">
          {/* Future: Settings, User menu, etc. */}
        </div>
      </div>
    </header>
  )
}