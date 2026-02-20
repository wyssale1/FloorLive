import React from 'react'
import { m, AnimatePresence } from 'framer-motion'
import FloorballBall from './FloorballBall'
import { useFloorballRain } from '../hooks/useFloorballRain'

const FloorballRain: React.FC = () => {
  const { particles, isActive } = useFloorballRain()

  return (
    <AnimatePresence>
      {isActive && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
        >
          {particles.map((particle) => (
            <m.div
              key={particle.id}
              className="absolute pointer-events-none"
              style={{
                left: particle.x,
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                perspective: 1000
              }}
              initial={{
                y: -100,
                opacity: 1 // Start immediately at full opacity
              }}
              animate={{
                y: window.innerHeight + 100,
                opacity: [1, 1, 0] // Stay visible, then fade out at the end
              }}
              transition={{
                delay: particle.delay,
                duration: particle.duration,
                ease: "easeIn", // Slightly accelerating like gravity
                opacity: {
                  times: [0, 0.8, 1], // Visible for 80%, fade out in last 20%
                  duration: particle.duration
                }
              }}
            >
              <m.div
                animate={{
                  rotate: 360 * 2 // Fixed 2 rotations
                }}
                transition={{
                  delay: particle.delay,
                  duration: particle.duration,
                  ease: "linear",
                  repeat: 0
                }}
                style={{}}
              >
                <FloorballBall
                  size={particle.size}
                  className="transform-gpu"
                />
              </m.div>
            </m.div>
          ))}
        </m.div>
      )}
    </AnimatePresence>
  )
}

export default FloorballRain