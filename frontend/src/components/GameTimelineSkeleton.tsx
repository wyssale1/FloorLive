import { Skeleton } from './ui/skeleton'

export default function GameTimelineSkeleton() {
  return (
    <div className="relative">
      {/* Central dotted line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px border-l-2 border-dashed border-gray-300 -translate-x-0.5"></div>
      
      <div className="space-y-4 py-4">
        {/* Period marker skeleton */}
        <div className="relative flex justify-center my-6">
          <div className="bg-white px-3 py-1 border border-gray-200 rounded-full">
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        {/* Timeline events */}
        {Array(8).fill(0).map((_, index) => {
          const isHomeEvent = index % 2 === 0
          
          return (
            <div key={index} className="relative flex items-center min-h-12">
              {isHomeEvent ? (
                <>
                  {/* Home team event - info on left */}
                  <div className="flex-1 flex justify-end pr-4">
                    <div className="text-right max-w-xs">
                      <Skeleton className="h-3 w-16 sm:w-24 ml-auto mb-1" />
                      <Skeleton className="h-2 w-12 sm:w-16 ml-auto" />
                    </div>
                  </div>

                  {/* Central icon */}
                  <div className="relative z-10 flex items-center justify-center">
                    <Skeleton className="w-6 h-6 rounded-full" />
                  </div>

                  {/* Time on right */}
                  <div className="flex-1 flex justify-start pl-4">
                    <Skeleton className="h-3 w-8" />
                  </div>
                </>
              ) : (
                <>
                  {/* Away team event - time on left */}
                  <div className="flex-1 flex justify-end pr-4">
                    <Skeleton className="h-3 w-8" />
                  </div>

                  {/* Central icon */}
                  <div className="relative z-10 flex items-center justify-center">
                    <Skeleton className="w-6 h-6 rounded-full" />
                  </div>

                  {/* Info on right */}
                  <div className="flex-1 flex justify-start pl-4">
                    <div className="text-left max-w-xs">
                      <Skeleton className="h-3 w-16 sm:w-24 mb-1" />
                      <Skeleton className="h-2 w-12 sm:w-16" />
                    </div>
                  </div>
                </>
              )}
            </div>
          )
        })}

        {/* Another period marker */}
        <div className="relative flex justify-center my-6">
          <div className="bg-white px-3 py-1 border border-gray-200 rounded-full">
            <Skeleton className="h-3 w-16" />
          </div>
        </div>

        {/* More events */}
        {Array(6).fill(0).map((_, index) => {
          const isHomeEvent = (index + 1) % 2 === 0
          
          return (
            <div key={`second-${index}`} className="relative flex items-center min-h-12">
              {isHomeEvent ? (
                <>
                  <div className="flex-1 flex justify-end pr-4">
                    <div className="text-right max-w-xs">
                      <Skeleton className="h-3 w-20 sm:w-28 ml-auto mb-1" />
                      <Skeleton className="h-2 w-10 sm:w-14 ml-auto" />
                    </div>
                  </div>
                  <div className="relative z-10 flex items-center justify-center">
                    <Skeleton className="w-6 h-6 rounded-full" />
                  </div>
                  <div className="flex-1 flex justify-start pl-4">
                    <Skeleton className="h-3 w-8" />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 flex justify-end pr-4">
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <div className="relative z-10 flex items-center justify-center">
                    <Skeleton className="w-6 h-6 rounded-full" />
                  </div>
                  <div className="flex-1 flex justify-start pl-4">
                    <div className="text-left max-w-xs">
                      <Skeleton className="h-3 w-20 sm:w-28 mb-1" />
                      <Skeleton className="h-2 w-10 sm:w-14" />
                    </div>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}