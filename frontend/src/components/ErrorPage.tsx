import { AlertCircle, Home, ArrowLeft, RefreshCcw, Wifi, WifiOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from '@tanstack/react-router'

export interface ErrorPageProps {
  type: '404' | '500' | 'network' | 'generic'
  title?: string
  message?: string
  showBackButton?: boolean
  showHomeButton?: boolean
  showRetryButton?: boolean
  onRetry?: () => void
  details?: string
}

const errorConfig = {
  '404': {
    icon: AlertCircle,
    title: 'Page Not Found',
    message: "The page you're looking for doesn't exist or has been moved.",
    color: 'text-blue-500',
    bgColor: 'bg-blue-50'
  },
  '500': {
    icon: AlertCircle,
    title: 'Server Error',
    message: "We're experiencing technical difficulties. Please try again later.",
    color: 'text-red-500',
    bgColor: 'bg-red-50'
  },
  'network': {
    icon: WifiOff,
    title: 'Connection Problem',
    message: 'Check your internet connection and try again.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50'
  },
  'generic': {
    icon: AlertCircle,
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50'
  }
}

export default function ErrorPage({
  type,
  title,
  message,
  showBackButton = true,
  showHomeButton = true,
  showRetryButton = false,
  onRetry,
  details
}: ErrorPageProps) {
  const navigate = useNavigate()
  const config = errorConfig[type]
  const Icon = config.icon

  const handleBack = () => {
    window.history.back()
  }

  const handleHome = () => {
    navigate({ to: '/' })
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md mx-auto"
      >
        {/* Error Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className={`inline-flex items-center justify-center w-16 h-16 ${config.bgColor} rounded-full mb-6`}
        >
          <Icon className={`w-8 h-8 ${config.color}`} />
        </motion.div>

        {/* Error Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-semibold text-gray-900 mb-3"
        >
          {title || config.title}
        </motion.h1>

        {/* Error Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-8 leading-relaxed"
        >
          {message || config.message}
        </motion.p>

        {/* Error Details (Dev Mode) */}
        {details && process.env.NODE_ENV === 'development' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-6 p-3 bg-gray-100 rounded-md text-left text-sm text-gray-700 font-mono"
          >
            {details}
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          {/* Retry Button */}
          {showRetryButton && (
            <button
              onClick={handleRetry}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          )}

          {/* Home Button */}
          {showHomeButton && (
            <button
              onClick={handleHome}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </button>
          )}

          {/* Back Button */}
          {showBackButton && (
            <button
              onClick={handleBack}
              className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </button>
          )}
        </motion.div>

        {/* Additional Help Text */}
        {type === 'network' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 text-sm text-gray-500"
          >
            <div className="flex items-center justify-center mb-2">
              <Wifi className="w-4 h-4 mr-1" />
              <span>Connection Status</span>
            </div>
            <div className="text-xs">
              {navigator.onLine ? (
                <span className="text-green-600">Connected to internet</span>
              ) : (
                <span className="text-red-600">No internet connection</span>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}