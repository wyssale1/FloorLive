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
      className={className}
      alt="Floorball"
      style={{
        filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
      }}
    />
  )
}

export default FloorballBall