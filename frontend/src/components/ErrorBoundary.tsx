import { Component, type ReactNode, type ErrorInfo } from 'react'
import ErrorPage from './ErrorPage'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
    
    // Update state with error info
    this.setState({
      error,
      errorInfo
    })

    // TODO: Log error to error reporting service in production
    // reportError(error, errorInfo)
  }

  handleRetry = () => {
    // Reset error state to try rendering again
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI - no technical details shown to users
      return (
        <div className="container mx-auto px-4 py-8">
          <ErrorPage
            type="generic"
            title="Oops! FloorLive had a whoopsie!"
            message={undefined} // Let ErrorPage use its random funny message
            showBackButton={true}
            showHomeButton={true}
            showRetryButton={true}
            onRetry={this.handleRetry}
            details={undefined} // Never show technical details to users
          />
        </div>
      )
    }

    return this.props.children
  }
}