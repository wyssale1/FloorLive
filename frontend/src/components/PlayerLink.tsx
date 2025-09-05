import { Link } from '@tanstack/react-router'
import { cn } from '../lib/utils'

interface PlayerLinkProps {
  playerId: string
  playerName: string
  className?: string
  children?: React.ReactNode
}

export default function PlayerLink({ 
  playerId, 
  playerName, 
  className, 
  children 
}: PlayerLinkProps) {
  // If no playerId is provided, render as plain text
  if (!playerId) {
    return (
      <span className={cn("text-current", className)}>
        {children || playerName}
      </span>
    )
  }

  return (
    <Link
      to="/player/$playerId"
      params={{ playerId }}
      className={cn(
        "text-current hover:text-gray-900 transition-colors cursor-pointer",
        "hover:underline decoration-gray-300 underline-offset-2",
        className
      )}
      aria-label={`View ${playerName} profile`}
    >
      {children || playerName}
    </Link>
  )
}