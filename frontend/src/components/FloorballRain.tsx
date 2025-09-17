import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FloorballBall from './FloorballBall'
import { useFloorballRain } from '../hooks/useFloorballRain'

const FloorballRain: React.FC = () => {
  const { particles, isActive } = useFloorballRain()

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
        >
          {particles.map((particle) => (
            <motion.div
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
                opacity: 0
              }}
              animate={{
                y: window.innerHeight + 100,
                opacity: [0, 1, 1, 0] // Fade in/out for better performance
              }}
              transition={{
                delay: particle.delay,
                duration: particle.duration,
                ease: "easeIn", // Slightly accelerating like gravity
                opacity: {
                  times: [0, 0.1, 0.9, 1],
                  duration: particle.duration
                }
              }}
            >
              <motion.div
                animate={{
                  rotate: 360 * 2 // Fixed 2 rotations
                }}
                transition={{
                  delay: particle.delay,
                  duration: particle.duration,
                  ease: "linear",
                  repeat: 0
                }}
                style={{
                  willChange: 'transform'
                }}
              >
                <FloorballBall
                  size={particle.size}
                  className="transform-gpu"
                />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FloorballRain