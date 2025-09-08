import { useState } from 'react'
import ErrorPage from '../components/ErrorPage'
import { usePageTitle } from '../hooks/usePageTitle'
import { useMetaTags } from '../hooks/useMetaTags'

export default function ServerError() {
  const [retryCount, setRetryCount] = useState(0)
  
  usePageTitle('Server Error - FloorLive')
  useMetaTags({
    title: 'Server Error - FloorLive',
    description: 'We are experiencing technical difficulties. Please try again later.',
    type: 'website'
  })

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    // Go back to home and refresh
    window.location.href = '/'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ErrorPage
        type="500"
        showBackButton={true}
        showHomeButton={true}
        showRetryButton={true}
        onRetry={handleRetry}
        details={retryCount > 0 ? `Retry attempts: ${retryCount}` : undefined}
      />
    </div>
  )
}