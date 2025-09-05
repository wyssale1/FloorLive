import { Skeleton } from './ui/skeleton'

export default function PlayerListSkeleton() {
  // Simulate different position groups with realistic player counts
  const positionGroups = [
    { name: 'Goalies', count: 2 },
    { name: 'Defenders', count: 8 },
    { name: 'Forwards', count: 12 }
  ]

  return (
    <div className="space-y-6">
      {positionGroups.map((group) => (
        <div key={group.name} className="space-y-3">
          {/* Position group header */}
          <div className="border-b border-gray-200 pb-2">
            <Skeleton className="h-4 w-32" />
          </div>
          
          {/* Players in this position */}
          <div className="space-y-0 divide-y divide-gray-100">
            {Array(group.count).fill(0).map((_, playerIndex) => (
              <div key={`${group.name}-${playerIndex}`} className="flex items-center justify-between py-3 first:pt-0">
                <div className="flex items-center space-x-3">
                  {/* Player number */}
                  <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                  
                  {/* Player info */}
                  <div className="min-w-0">
                    <Skeleton className="h-4 w-24 sm:w-32 mb-1" />
                    <Skeleton className="h-3 w-16 sm:w-20" />
                  </div>
                </div>
                
                {/* Stats (not all players will have stats) */}
                {Math.random() > 0.4 && (
                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <Skeleton className="h-3 w-4" />
                    <Skeleton className="h-3 w-4" />
                    <Skeleton className="h-3 w-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}