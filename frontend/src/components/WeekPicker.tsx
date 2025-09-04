import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'

interface WeekPickerProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
}

export default function WeekPicker({ selectedDate, onDateSelect }: WeekPickerProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(selectedDate, { weekStartsOn: 1 }) // Monday start
  )

  // Get all 7 days of the current week
  const weekDays = Array.from({ length: 7 }, (_, i) => 
    addDays(currentWeekStart, i)
  )

  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, -7))
  }

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }))
    onDateSelect(today)
  }

  const isToday = (date: Date) => isSameDay(date, new Date())
  const isSelected = (date: Date) => isSameDay(date, selectedDate)
  const isTodaySelected = isSelected(new Date())

  return (
    <div className="bg-white/60 backdrop-blur-sm border border-gray-100 rounded-lg p-4 mb-6">
      {/* Month/Year Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-600 font-medium">
          {format(currentWeekStart, 'MMMM yyyy')}
        </div>
        <button
          onClick={isTodaySelected ? undefined : goToToday}
          className={`text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 hover:bg-blue-50 rounded transition-all duration-200 ${
            isTodaySelected 
              ? 'opacity-0 pointer-events-none' 
              : 'opacity-100'
          }`}
        >
          Today
        </button>
      </div>
      
      <div className="flex items-center justify-between">
        {/* Previous Week Button */}
        <button
          onClick={goToPreviousWeek}
          className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>

        {/* Week Days */}
        <div className="flex space-x-0.5 sm:space-x-1 flex-1 justify-center">
          {weekDays.map((date) => {
            const dayName = format(date, 'EEE')
            const dayNumber = format(date, 'd')
            const selected = isSelected(date)
            const today = isToday(date)

            return (
              <button
                key={date.toString()}
                onClick={() => onDateSelect(date)}
                className={`
                  relative flex flex-col items-center px-2 py-1.5 rounded-md transition-colors min-w-[36px]
                  ${selected 
                    ? 'bg-blue-500 text-white' 
                    : 'hover:bg-gray-50 text-gray-700'
                  }
                  ${today && !selected ? 'ring-1 ring-blue-300' : ''}
                `}
              >
                {/* Day name */}
                <span className={`text-xs font-medium mb-0.5 ${
                  selected ? 'text-white' : 'text-gray-500'
                }`}>
                  {dayName}
                </span>
                
                {/* Day number */}
                <span className={`text-sm font-medium ${
                  selected ? 'text-white' : today ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {dayNumber}
                </span>

                {/* Today indicator */}
                {today && !selected && (
                  <div className="absolute -bottom-0.5 w-1 h-1 bg-blue-500 rounded-full" />
                )}
              </button>
            )
          })}
        </div>

        {/* Next Week Button */}
        <button
          onClick={goToNextWeek}
          className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
          aria-label="Next week"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  )
}