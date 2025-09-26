import { motion } from 'framer-motion'
import type { LiveGameStatus } from '../lib/liveGameUtils'

interface LiveBadgeProps {
  liveStatus: LiveGameStatus
  variant?: 'default' | 'compact' | 'large' | 'dot-only'
  showPulse?: boolean
}

export default function LiveBadge({ liveStatus, variant = 'default', showPulse = true }: LiveBadgeProps) {
  if (!liveStatus.isLive) return null

  // Just a pulsating dot for overview
  if (variant === 'dot-only') {
    return (
      <div className="relative">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        {showPulse && (
          <motion.div
            className="absolute inset-0 w-2 h-2 bg-red-500 rounded-full opacity-75"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.75, 0.3, 0.75]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </div>
    )
  }

  const sizeClasses = {
    compact: 'px-2 py-1 text-xs',
    default: 'px-3 py-1.5 text-sm',
    large: 'px-4 py-2 text-base'
  }

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`
          inline-flex items-center space-x-1.5 rounded-full font-medium
          bg-red-600 text-white shadow-sm
          ${sizeClasses[variant]}
        `}
      >
        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
        <span className="font-semibold">
          LIVE
        </span>
      </motion.div>
      
      {/* Pulsing animation */}
      {showPulse && (
        <motion.div
          className={`
            absolute inset-0 rounded-full bg-red-600 opacity-75 -z-10
            ${sizeClasses[variant]}
          `}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.75, 0.3, 0.75]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </div>
  )
}

/**
 * Period status badge for showing current period/intermission
 */
interface PeriodBadgeProps {
  period: string
  isIntermission?: boolean
  variant?: 'default' | 'compact'
}

export function PeriodBadge({ period, isIntermission = false, variant = 'default' }: PeriodBadgeProps) {
  if (!period) return null

  const sizeClasses = {
    compact: 'px-2 py-1 text-xs',
    default: 'px-3 py-1.5 text-sm'
  }

  const circleSize = {
    compact: 'w-2 h-2',
    default: 'w-2.5 h-2.5'
  }

  return (
    <div className="relative">
      <div className={`
        inline-flex items-center space-x-1.5 rounded-full font-medium
        ${isIntermission
          ? 'bg-orange-100 text-orange-800 border border-orange-200'
          : 'bg-red-100 text-red-800 border border-red-200'
        }
        ${sizeClasses[variant]}
      `}>
        <div className="relative flex items-center justify-center">
          <div className={`${circleSize[variant]} bg-red-600 rounded-full flex-shrink-0`} />
          {!isIntermission && (
            <motion.div
              className={`absolute ${circleSize[variant]} bg-red-600 rounded-full opacity-75`}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.75, 0.2, 0.75]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </div>
        <span className="font-medium">
          {isIntermission ? `${period} Break` : period}
        </span>
      </div>
    </div>
  )
}