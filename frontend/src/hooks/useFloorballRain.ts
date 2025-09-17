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

    // Create particles with staggered timing - let Framer Motion handle animation
    const isMobile = window.innerWidth < 768
    const particleCount = isMobile ? 15 : 25

    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * (window.innerWidth + 100) - 50,
      size: isMobile ? 16 + Math.random() * 14 : 20 + Math.random() * 20,
      delay: Math.random() * 3, // Stagger over 3 seconds
      duration: 8 + Math.random() * 4 // 8-12 seconds to fall (much slower)
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