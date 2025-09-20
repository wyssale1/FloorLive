import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

interface AnimatedTextProps {
  originalText: string
  newText: string
  isAnimating: boolean
  className?: string
  onAnimationComplete?: () => void
}

export default function AnimatedText({
  originalText,
  newText,
  isAnimating,
  className = '',
  onAnimationComplete
}: AnimatedTextProps) {
  const [currentText, setCurrentText] = useState(originalText)
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'transforming' | 'complete'>('idle')

  useEffect(() => {
    if (!isAnimating) {
      setCurrentText(originalText)
      setAnimationPhase('idle')
      return
    }

    setAnimationPhase('transforming')

    // Animation logic: transform character by character
    const maxLength = Math.max(originalText.length, newText.length)
    let step = 0

    const animateStep = () => {
      if (step <= maxLength) {
        // Build the new text character by character
        const newCurrentText = newText.slice(0, step) + originalText.slice(step)
        setCurrentText(newCurrentText.slice(0, maxLength))
        step++
        setTimeout(animateStep, 100) // 100ms between character changes
      } else {
        setAnimationPhase('complete')
        onAnimationComplete?.()
      }
    }

    // Start animation after a brief delay
    setTimeout(animateStep, 200)
  }, [isAnimating, originalText, newText, onAnimationComplete])

  return (
    <span className={className}>
      <AnimatePresence mode="wait">
        {animationPhase === 'transforming' ? (
          <motion.span
            key="animating"
            initial={{ scale: 1 }}
            animate={{
              scale: [1, 1.05, 1],
              color: ['currentColor', '#eab308', 'currentColor'] // yellow flash during animation
            }}
            transition={{
              duration: 0.6,
              repeat: Math.ceil(newText.length / 2), // Pulse during transformation
              ease: "easeInOut"
            }}
          >
            {currentText}
          </motion.span>
        ) : (
          <motion.span
            key={isAnimating ? 'new-text' : 'original-text'}
            initial={isAnimating ? {
              scale: 1.1,
              color: '#eab308' // Start with yellow
            } : { scale: 1 }}
            animate={{
              scale: 1,
              color: 'currentColor'
            }}
            transition={{
              duration: 0.3,
              ease: "easeOut"
            }}
          >
            {currentText}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}