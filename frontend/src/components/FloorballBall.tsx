import React from 'react'

interface FloorballBallProps {
  size?: number
  className?: string
}

const FloorballBall: React.FC<FloorballBallProps> = ({
  size = 24,
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 342.74 342.11"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main ball gradient */}
      <defs>
        <radialGradient id={`ballGradient-${size}`} cx="0.3" cy="0.3" r="0.8">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#f0f0f0" />
          <stop offset="100%" stopColor="#d0d0d0" />
        </radialGradient>
      </defs>

      {/* Main ball circle */}
      <circle
        cx="171.37"
        cy="171.05"
        r="169.7"
        fill={`url(#ballGradient-${size})`}
        stroke="#9d9d9c"
        strokeWidth="1"
      />

      {/* Floorball holes pattern */}
      <g fill="#9d9d9c" opacity="0.6">
        {/* Center holes */}
        <circle cx="171" cy="171" r="8" />
        <circle cx="151" cy="151" r="6" />
        <circle cx="191" cy="151" r="6" />
        <circle cx="151" cy="191" r="6" />
        <circle cx="191" cy="191" r="6" />

        {/* Outer ring holes */}
        <circle cx="131" cy="131" r="5" />
        <circle cx="211" cy="131" r="5" />
        <circle cx="131" cy="211" r="5" />
        <circle cx="211" cy="211" r="5" />
        <circle cx="171" cy="111" r="5" />
        <circle cx="171" cy="231" r="5" />
        <circle cx="111" cy="171" r="5" />
        <circle cx="231" cy="171" r="5" />

        {/* Additional smaller holes */}
        <circle cx="141" cy="111" r="3" />
        <circle cx="201" cy="111" r="3" />
        <circle cx="141" cy="231" r="3" />
        <circle cx="201" cy="231" r="3" />
        <circle cx="111" cy="141" r="3" />
        <circle cx="111" cy="201" r="3" />
        <circle cx="231" cy="141" r="3" />
        <circle cx="231" cy="201" r="3" />
      </g>
    </svg>
  )
}

export default FloorballBall