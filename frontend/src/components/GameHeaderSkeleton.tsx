import { Skeleton } from './ui/skeleton'

export default function GameHeaderSkeleton() {
  return (
    <div className="bg-white/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Home Team Skeleton */}
          <div className="flex flex-col items-center text-center flex-1">
            <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-full mb-3" />
            <div className="w-full">
              <Skeleton className="h-4 w-20 mx-auto mb-1" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          </div>

          {/* Score Skeleton */}
          <div className="text-center flex-shrink-0">
            <Skeleton className="h-8 sm:h-12 w-24 sm:w-32 mx-auto mb-2" />
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="w-2 h-2 rounded-full" />
              <Skeleton className="w-2 h-2 rounded-full" />
            </div>
            <Skeleton className="h-3 w-16 mx-auto mb-1" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>

          {/* Away Team Skeleton */}
          <div className="flex flex-col items-center text-center flex-1">
            <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-full mb-3" />
            <div className="w-full">
              <Skeleton className="h-4 w-20 mx-auto mb-1" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}