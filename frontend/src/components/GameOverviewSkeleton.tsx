import { Skeleton } from './ui/skeleton'

export default function GameOverviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Game Information Section Skeleton */}
      <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-4 sm:p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Date and Time */}
          <div className="flex items-center space-x-2">
            <Skeleton className="w-4 h-4 rounded" />
            <div>
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          {/* League */}
          <div className="flex items-center space-x-2">
            <Skeleton className="w-4 h-4 rounded" />
            <div>
              <Skeleton className="h-4 w-12 mb-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>

          {/* Venue */}
          <div className="flex items-center space-x-2">
            <Skeleton className="w-4 h-4 rounded" />
            <div>
              <Skeleton className="h-4 w-10 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          {/* Spectators */}
          <div className="flex items-center space-x-2">
            <Skeleton className="w-4 h-4 rounded" />
            <div>
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-4 w-14" />
            </div>
          </div>

          {/* Referees */}
          <div className="flex items-center space-x-2 sm:col-span-2">
            <Skeleton className="w-4 h-4 rounded" />
            <div>
              <Skeleton className="h-4 w-14 mb-1" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>
      </div>

      {/* Head-to-Head Section Skeleton */}
      <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-4 sm:p-6">
        <Skeleton className="h-6 w-28 mb-4" />
        
        {/* Game cards skeleton */}
        <div className="space-y-1">
          {Array(3).fill(0).map((_, index) => (
            <div key={`skeleton-${index}`}>
              <div className="p-3">
                <div className="flex items-center">
                  {/* Left side - Score or time */}
                  <div className="min-w-[40px] text-center mr-3">
                    <Skeleton className="h-4 w-8 mx-auto mb-1" />
                    <Skeleton className="h-4 w-8 mx-auto" />
                  </div>
                  
                  {/* Teams */}
                  <div className="flex-1 space-y-2">
                    {/* Home team */}
                    <div className="flex items-center space-x-3">
                      <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
                      <Skeleton className="h-4 w-24 flex-1" />
                    </div>
                    {/* Away team */}
                    <div className="flex items-center space-x-3">
                      <Skeleton className="w-6 h-6 rounded-full flex-shrink-0" />
                      <Skeleton className="h-4 w-28 flex-1" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Separator line between games (not after the last one) */}
              {index < 2 && (
                <div className="border-b border-gray-100 mx-3 my-1"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}