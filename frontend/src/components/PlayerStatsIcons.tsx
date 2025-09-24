import { Target, User, Hash } from 'lucide-react'

interface PlayerStatsIconsProps {
  goals?: number
  assists?: number
  points?: number
  className?: string
  size?: 'small' | 'medium'
  showZeros?: boolean
}

export default function PlayerStatsIcons({
  goals = 0,
  assists = 0,
  points = 0,
  className = '',
  size = 'small',
  showZeros = false
}: PlayerStatsIconsProps) {
  const iconSize = size === 'small' ? 'w-3 h-3' : 'w-4 h-4'
  const textSize = size === 'small' ? 'text-xs' : 'text-sm'

  // Don't render if all stats are 0 and showZeros is false
  if (!showZeros && goals === 0 && assists === 0 && points === 0) {
    return null
  }

  return (
    <div className={`flex items-center space-x-2 ${textSize} text-gray-600 ${className}`}>
      {(goals > 0 || showZeros) && (
        <div className="flex items-center space-x-1">
          <Target className={iconSize} />
          <span>{goals}</span>
        </div>
      )}
      {(assists > 0 || showZeros) && (
        <div className="flex items-center space-x-1">
          <User className={iconSize} />
          <span>{assists}</span>
        </div>
      )}
      {(points > 0 || showZeros) && (
        <div className="flex items-center space-x-1">
          <Hash className={iconSize} />
          <span>{points}</span>
        </div>
      )}
    </div>
  )
}