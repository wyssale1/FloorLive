import React from 'react'
import floorballSvg from '../assets/floorball-svg.svg'

interface FloorballBallProps {
  size?: number
  className?: string
}

const FloorballBall: React.FC<FloorballBallProps> = ({
  size = 24,
  className = ''
}) => {
  return (
    <img
      src={floorballSvg}
      width={size}
      height={size}
      className={`${className} select-none`}
      alt="Floorball"
      style={{
        filter: 'drop-shadow(1px 1px 3px rgba(0,0,0,0.2))', // Lighter shadow for performance
        imageRendering: 'optimizeSpeed' as any, // Optimize for animation performance
        transform: 'translateZ(0)' // Force GPU acceleration
      }}
      draggable={false}
    />
  )
}

export default FloorballBall