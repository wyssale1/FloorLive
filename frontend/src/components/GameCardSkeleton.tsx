import { Skeleton } from './ui/skeleton'

interface GameCardSkeletonProps {
  count?: number
}

export default function GameCardSkeleton({ count = 1 }: GameCardSkeletonProps) {
  return (
    <>
      {Array(count).fill(0).map((_, index) => (
        <div key={index} className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-100">
          {/* Main content */}
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
      ))}
    </>
  )
}