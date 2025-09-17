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
              style={{ left: particle.x }}
              initial={{
                y: -100,
                rotate: 0,
                scale: 0
              }}
              animate={{
                y: window.innerHeight + 200, // Fall well past the bottom edge
                rotate: 360 * (2 + Math.random()), // 2-3 full rotations
                scale: 1
              }}
              transition={{
                delay: particle.delay,
                duration: particle.duration,
                ease: "linear", // Constant speed like real falling objects
                rotate: {
                  duration: particle.duration,
                  ease: "linear"
                },
                scale: {
                  duration: 0.3,
                  ease: "easeOut"
                }
              }}
              // Remove exit animation - let balls disappear naturally off-screen
            >
              <FloorballBall
                size={particle.size}
                className="drop-shadow-md"
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FloorballRain