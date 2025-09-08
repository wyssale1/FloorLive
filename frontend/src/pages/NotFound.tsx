import ErrorPage from '../components/ErrorPage'
import { usePageTitle } from '../hooks/usePageTitle'
import { useMetaTags } from '../hooks/useMetaTags'

export default function NotFound() {
  usePageTitle('Page Not Found - FloorLive')
  useMetaTags({
    title: 'Page Not Found - FloorLive',
    description: 'The page you are looking for could not be found.',
    type: 'website'
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <ErrorPage
        type="404"
        showBackButton={true}
        showHomeButton={true}
        showRetryButton={false}
      />
    </div>
  )
}