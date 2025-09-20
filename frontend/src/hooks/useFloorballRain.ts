import { useEffect, useState } from 'react'
import { useEasterEggStore } from '../stores/easterEggStore'

interface FloorballParticle {
  id: number
  x: number
  size: number
  delay: number
  duration: number
}

export const useFloorballRain = () => {
  const { floorballRainActive, endFloorballRain, setFloorballCooldown } = useEasterEggStore()
  const [particles, setParticles] = useState<FloorballParticle[]>([])

  useEffect(() => {
    if (!floorballRainActive) {
      setParticles([])
      return
    }

    // Create particles with staggered timing - optimized for performance
    const isMobile = window.innerWidth < 768
    const particleCount = isMobile ? 8 : 12 // Reduced particle count

    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * (window.innerWidth + 100) - 50,
      size: isMobile ? 18 + Math.random() * 10 : 22 + Math.random() * 16,
      delay: Math.random() * 0.5, // Appear within 0.5 seconds for immediate impact
      duration: 2 + Math.random() * 1 // 2-3 seconds to fall (much faster)
    }))

    setParticles(newParticles)

    // End animation after particles have had time to complete
    const maxDuration = Math.max(...newParticles.map(p => p.delay + p.duration))
    const cleanup = setTimeout(() => {
      endFloorballRain()
      setTimeout(() => {
        setFloorballCooldown(false)
      }, 2000) // 2 second cooldown after animation ends
    }, maxDuration * 1000 + 1000) // Add 1 second buffer

    return () => {
      clearTimeout(cleanup)
    }
  }, [floorballRainActive, endFloorballRain, setFloorballCooldown])

  return { particles, isActive: floorballRainActive }
}