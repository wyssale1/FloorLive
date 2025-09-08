import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, startOfWeek, isSameDay, getDay } from 'date-fns'

// Utility function to calculate the same day of week in a different week
const calculateSameDayInWeek = (selectedDate: Date, newWeekStart: Date): Date => {
  const selectedDayOfWeek = getDay(selectedDate) // 0 = Sunday, 1 = Monday, etc.
  const mondayOffset = selectedDayOfWeek === 0 ? 6 : selectedDayOfWeek - 1 // Convert to Monday = 0
  return addDays(newWeekStart, mondayOffset)
}

// Navigation button component for consistent styling
interface NavigationButtonProps {
  onClick: () => void
  direction: 'previous' | 'next'
  'aria-label': string
}

const NavigationButton = ({ onClick, direction, 'aria-label': ariaLabel }: NavigationButtonProps) => {
  const Icon = direction === 'previous' ? ChevronLeft : ChevronRight
  
  return (
    <button
      onClick={onClick}
      className="p-1.5 -mx-1.5 sm:-mx-1 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors duration-150 touch-manipulation flex items-center justify-center min-h-[36px] min-w-[36px]"
      aria-label={ariaLabel}
    >
      <Icon className="w-5 h-5 text-gray-600" />
    </button>
  )
}

// Helper function for date button classes
const getDateButtonClasses = (selected: boolean, today: boolean): string => {
  if (selected) {
    return 'bg-blue-500 text-white hover:bg-blue-600'
  }
  
  if (today) {
    return 'bg-blue-50/80 text-blue-700 hover:bg-blue-100/80'
  }
  
  return 'hover:bg-gray-50 text-gray-700'
}

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
    const newWeekStart = addDays(currentWeekStart, -7)
    const newSelectedDate = calculateSameDayInWeek(selectedDate, newWeekStart)
    
    setCurrentWeekStart(newWeekStart)
    onDateSelect(newSelectedDate)
  }

  const goToNextWeek = () => {
    const newWeekStart = addDays(currentWeekStart, 7)
    const newSelectedDate = calculateSameDayInWeek(selectedDate, newWeekStart)
    
    setCurrentWeekStart(newWeekStart)
    onDateSelect(newSelectedDate)
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
      
      <div className="flex items-center justify-center">
        {/* Previous Week Button */}
        <NavigationButton 
          onClick={goToPreviousWeek}
          direction="previous"
          aria-label="Previous week"
        />

        {/* Week Days */}
        <div className="flex space-x-0.5 sm:space-x-1 justify-center mx-2">
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
                  relative flex flex-col items-center px-2 py-1.5 rounded-md transition-colors duration-150 min-w-[36px]
                  ${getDateButtonClasses(selected, today)}
                `}
              >
                {/* Day name */}
                <span className={`text-xs font-medium mb-0.5 ${
                  selected ? 'text-white' : today ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {dayName}
                </span>
                
                {/* Day number */}
                <span className={`text-sm font-medium ${
                  selected ? 'text-white' : today ? 'text-blue-700' : 'text-gray-900'
                }`}>
                  {dayNumber}
                </span>
              </button>
            )
          })}
        </div>

        {/* Next Week Button */}
        <NavigationButton 
          onClick={goToNextWeek}
          direction="next"
          aria-label="Next week"
        />
      </div>
    </div>
  )
}