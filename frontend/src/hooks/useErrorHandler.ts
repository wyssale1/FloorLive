import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AppError, getErrorInfo, logError, formatErrorMessage } from '../lib/errorHandler'

/**
 * Custom hook for handling errors throughout the application
 */
export function useErrorHandler() {
  const navigate = useNavigate()

  const handleError = useCallback((error: Error | AppError, context?: string) => {
    // Log the error
    logError(error, context)

    if (error instanceof AppError) {
      const errorInfo = getErrorInfo(error.status)

      // Route to appropriate error page based on error type
      switch (errorInfo.type) {
        case 'network':
          navigate({ to: '/network-error' })
          break
        case '404':
          navigate({ to: '/not-found' })
          break
        case '500':
          navigate({ to: '/server-error' })
          break
        default:
          // For other errors, show a toast or stay on current page
          console.error('Handled error:', formatErrorMessage(error))
          break
      }
    } else {
      // Unknown error - let error boundary handle or show generic message
      console.error('Unhandled error:', formatErrorMessage(error))
    }
  }, [navigate])

  const handleApiError = useCallback(async (
    apiCall: () => Promise<any>,
    context?: string
  ) => {
    try {
      return await apiCall()
    } catch (error) {
      handleError(error as Error, context)
      throw error // Re-throw so calling components can handle loading states
    }
  }, [handleError])

  return {
    handleError,
    handleApiError,
    formatErrorMessage
  }
}