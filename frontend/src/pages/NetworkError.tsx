import { useState, useEffect } from 'react'
import ErrorPage from '../components/ErrorPage'
import { usePageTitle } from '../hooks/usePageTitle'
import { useMetaTags } from '../hooks/useMetaTags'

export default function NetworkError() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [retryCount, setRetryCount] = useState(0)

  usePageTitle('Connection Problem - FloorLive')
  useMetaTags({
    title: 'Connection Problem - FloorLive',
    description: 'Unable to connect to FloorLive. Please check your internet connection.',
    type: 'website'
  })

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1)
    
    // Test connection by trying to fetch a simple endpoint
    try {
      const response = await fetch('/api/health', { 
        method: 'GET',
        cache: 'no-cache' 
      })
      
      if (response.ok) {
        // Connection restored, go back to home
        window.location.href = '/'
      }
    } catch (error) {
      // Still no connection, stay on error page
      console.log('Connection test failed:', error)
    }
  }

  const getMessage = () => {
    if (!isOnline) {
      return 'You appear to be offline. Please check your internet connection and try again.'
    }
    return 'Unable to connect to FloorLive servers. Please check your connection and try again.'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ErrorPage
        type="network"
        message={getMessage()}
        showBackButton={true}
        showHomeButton={true}
        showRetryButton={true}
        onRetry={handleRetry}
        details={process.env.NODE_ENV === 'development' ? 
          `Online: ${isOnline}, Retries: ${retryCount}` : undefined
        }
      />
    </div>
  )
}