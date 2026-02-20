import { m } from 'framer-motion'
import { Crown as CrownIcon } from 'lucide-react'

interface CrownProps {
  className?: string
}

export default function Crown({ className = '' }: CrownProps) {
  return (
    <m.div
      initial={{ 
        y: -10, 
        opacity: 0, 
        scale: 0.5, 
        rotate: 0 
      }}
      animate={{ 
        y: 0, 
        opacity: 1, 
        scale: 1, 
        rotate: -15 
      }}
      transition={{ 
        type: "spring", 
        damping: 15, 
        stiffness: 300,
        duration: 0.6
      }}
      className={`absolute -top-1 -left-1 pointer-events-none ${className}`}
      style={{ 
        transformOrigin: 'center center',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
      }}
    >
      <m.div
        animate={{ 
          y: [0, -1, 0], 
          rotate: [-15, -12, -15] 
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      >
        <CrownIcon className="w-4 h-4 text-yellow-500 fill-white stroke-yellow-500" strokeWidth={2} />
      </m.div>
    </m.div>
  )
}