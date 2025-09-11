/**
 * Centralized error handling utilities for FloorLive frontend
 */

export interface ApiErrorResponse {
  error: string
  message: string
  status?: number
  timestamp?: string
  path?: string
  details?: any
}

export class AppError extends Error {
  status: number
  code: string
  details?: any

  constructor(
    message: string,
    status: number = 500,
    code: string = 'UNKNOWN_ERROR',
    details?: any
  ) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
    this.details = details
  }
}

/**
 * Maps HTTP status codes to user-friendly error information
 */
export function getErrorInfo(status: number) {
  const errorMap: Record<number, { type: 'network' | '404' | '500' | 'generic', title: string, message: string, showRetry: boolean }> = {
    // Client errors
    400: {
      type: 'generic',
      title: 'Bad Request',
      message: 'The request could not be understood. Please try again.',
      showRetry: true
    },
    401: {
      type: 'generic',
      title: 'Unauthorized',
      message: 'You need to be logged in to access this content.',
      showRetry: false
    },
    403: {
      type: 'generic',
      title: 'Access Denied',
      message: 'You don\'t have permission to access this resource.',
      showRetry: false
    },
    404: {
      type: '404',
      title: 'Not Found',
      message: 'The requested resource could not be found.',
      showRetry: false
    },
    429: {
      type: 'generic',
      title: 'Too Many Requests',
      message: 'You\'re making too many requests. Please wait a moment and try again.',
      showRetry: true
    },
    // Server errors
    500: {
      type: '500',
      title: 'Server Error',
      message: 'We\'re experiencing technical difficulties. Please try again later.',
      showRetry: true
    },
    502: {
      type: '500',
      title: 'Service Unavailable',
      message: 'The service is temporarily unavailable. Please try again in a few minutes.',
      showRetry: true
    },
    503: {
      type: '500',
      title: 'Service Unavailable',
      message: 'The service is currently under maintenance. Please try again later.',
      showRetry: true
    },
    504: {
      type: 'network',
      title: 'Timeout',
      message: 'The request timed out. Please check your connection and try again.',
      showRetry: true
    }
  }

  return errorMap[status] || {
    type: 'generic' as const,
    title: 'Error',
    message: 'An unexpected error occurred. Please try again.',
    showRetry: true
  }
}

/**
 * Enhanced fetch wrapper with error handling
 */
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {},
  retryCount = 0,
  maxRetries = 2
): Promise<T> {
  // Dynamic API URL detection (same logic as Home.tsx)
  const getApiBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL
    }
    
    if (import.meta.env.DEV) {
      const currentHost = window.location.hostname
      if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
        return `http://100.99.89.57:3001/api`
      }
    }
    
    return 'http://localhost:3001/api'
  }

  const API_BASE_URL = getApiBaseUrl()
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`

  try {
    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    // Handle different response types
    if (!response.ok) {
      let errorData: ApiErrorResponse
      
      try {
        errorData = await response.json()
      } catch {
        // If response is not JSON, create a generic error
        errorData = {
          error: `HTTP ${response.status}`,
          message: response.statusText || 'An error occurred',
          status: response.status
        }
      }

      throw new AppError(
        errorData.message || `Request failed with status ${response.status}`,
        response.status,
        errorData.error || 'API_ERROR',
        errorData
      )
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return await response.json()
    }
    
    return response.text() as Promise<T>

  } catch (error) {
    // Network or other errors
    if (error instanceof AppError) {
      throw error
    }

    // Retry logic for network errors
    if (retryCount < maxRetries && isRetryableError(error)) {
      console.log(`Retrying request (${retryCount + 1}/${maxRetries})...`)
      await delay(1000 * (retryCount + 1)) // Exponential backoff
      return apiRequest(url, options, retryCount + 1, maxRetries)
    }

    // Network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new AppError(
        'Network error. Please check your connection and try again.',
        0,
        'NETWORK_ERROR'
      )
    }

    // Unknown error
    throw new AppError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      500,
      'UNKNOWN_ERROR',
      error
    )
  }
}

/**
 * Determines if an error should trigger a retry
 */
function isRetryableError(error: any): boolean {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }
  
  // HTTP errors that can be retried
  if (error instanceof AppError) {
    const retryableStatuses = [408, 429, 500, 502, 503, 504]
    return retryableStatuses.includes(error.status)
  }
  
  return false
}

/**
 * Simple delay utility for retry logic
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Route to appropriate error page based on error type
 */
export function redirectToErrorPage(error: AppError | Error) {
  if (error instanceof AppError) {
    const errorInfo = getErrorInfo(error.status)
    
    switch (errorInfo.type) {
      case 'network':
        window.location.href = '/network-error'
        break
      case '404':
        // 404 is handled by TanStack Router automatically
        break
      case '500':
        window.location.href = '/server-error'
        break
      default:
        // Stay on current page, let error boundary handle it
        throw error
    }
  } else {
    // Unknown error, let error boundary handle it
    throw error
  }
}

/**
 * Create user-friendly error messages
 */
export function formatErrorMessage(error: Error | AppError): string {
  if (error instanceof AppError) {
    return error.message
  }
  
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'Network error. Please check your internet connection.'
  }
  
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Log errors for debugging (development) or reporting (production)
 */
export function logError(error: Error | AppError, context?: string) {
  const errorData = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    ...(error instanceof AppError && {
      status: error.status,
      code: error.code,
      details: error.details
    })
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorData)
  } else {
    // TODO: Send to error reporting service in production
    // Example: Sentry, LogRocket, etc.
    // errorReportingService.captureException(error, errorData)
  }
}