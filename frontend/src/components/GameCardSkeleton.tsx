import { Skeleton } from './ui/skeleton'

interface GameCardSkeletonProps {
  count?: number
  variant?: 'section' | 'list' | 'individual'
}

export default function GameCardSkeleton({ count = 1, variant = 'individual' }: GameCardSkeletonProps) {
  const renderSkeleton = (index: number) => (
    <div key={index} className={
      variant === 'individual' 
        ? "bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-gray-100"
        : "p-3"
    }>
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
  )

  if (variant === 'section') {
    return (
      <div className="mb-8">
        {/* Title skeleton */}
        <div className="mb-4 px-1">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        
        {/* Games in one box with separators - slightly more compact */}
        <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100">
          {Array(count).fill(0).map((_, index) => (
            <div key={index}>
              <div className="p-3">
                <div className="flex items-center">
                  {/* Left side - Score or time */}
                  <div className="min-w-[40px] text-center mr-3">
                    <Skeleton className="h-4 w-8 mx-auto mb-1" />
                    <Skeleton className="h-4 w-8 mx-auto" />
                  </div>
                  
                  {/* Teams - slightly smaller for compactness */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
                      <Skeleton className="h-3.5 w-20 flex-1" />
                    </div>
                    <div className="flex items-center space-x-3">
                      <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
                      <Skeleton className="h-3.5 w-24 flex-1" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Separator line between games (not after the last one) */}
              {index < count - 1 && (
                <div className="mx-3 border-b border-gray-100"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'list') {
    return (
      <>
        {Array(count).fill(0).map((_, index) => (
          <div key={index}>
            {renderSkeleton(index)}
            {/* Separator line between games (not after the last one) */}
            {index < count - 1 && (
              <div className="border-b border-gray-100 mx-3 my-1"></div>
            )}
          </div>
        ))}
      </>
    )
  }

  // Individual variant (default)
  return (
    <>
      {Array(count).fill(0).map((_, index) => renderSkeleton(index))}
    </>
  )
}