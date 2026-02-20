import { Skeleton } from './ui/skeleton'

interface LeagueTableSkeletonProps {
  teamCount?: number
}

export default function LeagueTableSkeleton({ teamCount = 12 }: LeagueTableSkeletonProps) {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-lg border border-gray-100 p-3 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-6 w-24 rounded" />
        </div>
        <Skeleton className="h-6 w-16 rounded" />
      </div>

      {/* Header Row */}
      <div className="flex items-center justify-between py-2 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
        <div className="flex items-center space-x-3">
          <div className="w-8 pl-1"></div>
          <div className="w-8"></div>
          <div className="pl-0">Team</div>
        </div>
        <div className="flex items-center space-x-4 flex-shrink-0 pr-1">
          <div className="text-center w-8">Pts</div>
          <div className="hidden sm:block text-center w-8">Diff</div>
          <div className="hidden md:block text-center w-8">GP</div>
        </div>
      </div>

      {/* Table Rows */}
      <div className="space-y-0 divide-y divide-gray-200">
        {Array(teamCount).fill(0).map((_, index) => (
          <div key={`skeleton-${index}`} className="flex items-center justify-between py-3 px-0">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              {/* Position Number */}
              <div className="flex-shrink-0 w-8 pl-1">
                <Skeleton className="w-5 h-5 rounded-full" />
              </div>

              {/* Team Logo */}
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />

              {/* Team Info */}
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>

            {/* Right Side Stats */}
            <div className="flex items-center space-x-4 text-sm flex-shrink-0 pr-1">
              {/* Points */}
              <div className="text-center w-8">
                <Skeleton className="h-4 w-6 mx-auto" />
              </div>

              {/* Goal Difference - Hidden on mobile */}
              <div className="hidden sm:block text-center w-8">
                <Skeleton className="h-4 w-6 mx-auto" />
              </div>

              {/* Games Played - Hidden on tablet */}
              <div className="hidden md:block text-center w-8">
                <Skeleton className="h-4 w-6 mx-auto" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}