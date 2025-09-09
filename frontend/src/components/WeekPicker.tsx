import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { format, addDays, startOfWeek, isSameDay, getDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { motion } from 'framer-motion'

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
  const [isMonthViewExpanded, setIsMonthViewExpanded] = useState(false)

  // Sync currentWeekStart with selectedDate changes
  useEffect(() => {
    const newWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
    if (newWeekStart.getTime() !== currentWeekStart.getTime()) {
      setCurrentWeekStart(newWeekStart)
    }
  }, [selectedDate, currentWeekStart])

  // Get all 7 days of the current week
  const weekDays = Array.from({ length: 7 }, (_, i) => 
    addDays(currentWeekStart, i)
  )

  // Get all days for the full month view (including padding days)
  const getMonthDays = () => {
    const monthStart = startOfMonth(selectedDate)
    const monthEnd = endOfMonth(selectedDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = addDays(startOfWeek(monthEnd, { weekStartsOn: 1 }), 41) // 6 weeks * 7 days - 1
    
    return eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd
    }).slice(0, 42) // Ensure exactly 6 rows
  }

  const monthDays = isMonthViewExpanded ? getMonthDays() : []
  const displayDays = isMonthViewExpanded ? monthDays : weekDays

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

  const goToPreviousMonth = () => {
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, selectedDate.getDate())
    const newWeekStart = startOfWeek(newDate, { weekStartsOn: 1 })
    setCurrentWeekStart(newWeekStart)
    onDateSelect(newDate)
  }

  const goToNextMonth = () => {
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, selectedDate.getDate())
    const newWeekStart = startOfWeek(newDate, { weekStartsOn: 1 })
    setCurrentWeekStart(newWeekStart)
    onDateSelect(newDate)
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }))
    onDateSelect(today)
  }

  const toggleMonthView = () => {
    setIsMonthViewExpanded(prev => !prev)
  }

  const handleMonthDateSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 1 }))
      onDateSelect(date)
      // Keep month view open for easier navigation
    }
  }

  const isToday = (date: Date) => isSameDay(date, new Date())
  const isSelected = (date: Date) => isSameDay(date, selectedDate)
  const isTodaySelected = isSelected(new Date())
  const isOutsideMonth = (date: Date) => {
    const currentMonth = selectedDate.getMonth()
    return date.getMonth() !== currentMonth
  }

  const isInSelectedWeek = (date: Date) => {
    return weekDays.some(weekDay => isSameDay(weekDay, date))
  }

  // Calculate which row in the month grid contains the current week
  const getCurrentWeekRowIndex = () => {
    if (!isMonthViewExpanded) return 0
    
    const monthStart = startOfMonth(selectedDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
    
    const daysDiff = Math.floor((selectedWeekStart.getTime() - calendarStart.getTime()) / (1000 * 60 * 60 * 24))
    return Math.floor(daysDiff / 7)
  }

  // Group month days into rows of 7
  const getMonthRows = () => {
    if (!isMonthViewExpanded) {
      return [weekDays] // In week mode, just one row
    }
    
    const rows: Date[][] = []
    for (let i = 0; i < monthDays.length; i += 7) {
      rows.push(monthDays.slice(i, i + 7))
    }
    return rows
  }

  const monthRows = getMonthRows()
  const currentWeekRowIndex = getCurrentWeekRowIndex()

  // Calculate offset to make current week start at exact week view position
  const calculateCurrentWeekOffset = () => {
    if (!isMonthViewExpanded) return 0
    
    // Each row is approximately 44px (36px button + 8px gap)
    const rowHeight = 44
    
    // Fine-tune variable - adjust this to move current week up (+) or down (-)
    const finetuneOffset = 16 // Start with 8px down, you can adjust this
    
    // In week view, current week sits at y=0 (first row position)
    // In month view, current week sits at y=(currentWeekRowIndex * rowHeight)
    // So we need to offset it back to y=0 to match week view position
    return -(currentWeekRowIndex * rowHeight) + finetuneOffset
  }

  const currentWeekInitialOffset = calculateCurrentWeekOffset()

  return (
    <div className="bg-white/60 backdrop-blur-sm border border-gray-100 rounded-lg p-4 mb-6">
      {/* Static Month/Year Header - Never moves */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-600 font-medium">
          {format(currentWeekStart, 'MMMM yyyy')}
        </div>
        <div className="flex items-center gap-2">
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
          <button
            onClick={toggleMonthView}
            className={`p-1.5 rounded-lg transition-all duration-200 flex items-center justify-center min-h-[28px] min-w-[28px] ${
              isMonthViewExpanded
                ? 'bg-blue-50 hover:bg-blue-100'
                : 'hover:bg-gray-50'
            }`}
            aria-label={isMonthViewExpanded ? "Close month view" : "Open month view"}
          >
            <CalendarIcon className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      </div>

      {/* Navigation and Calendar Container */}
      <div className="flex items-start justify-center">
        {/* Previous Week/Month Button */}
        <NavigationButton 
          onClick={isMonthViewExpanded ? goToPreviousMonth : goToPreviousWeek}
          direction="previous"
          aria-label={isMonthViewExpanded ? "Previous month" : "Previous week"}
        />

        {/* Layered Animation Calendar */}
        <div className="mx-2 flex flex-col items-center">
          {/* Static Day Names Header */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 w-full max-w-sm">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, index) => {
              // In week mode, check if this column's day is selected
              const weekDayForColumn = weekDays[index]
              const isColumnSelected = !isMonthViewExpanded && weekDayForColumn && isSelected(weekDayForColumn)
              const isColumnToday = !isMonthViewExpanded && weekDayForColumn && isToday(weekDayForColumn)
              
              return (
                <div 
                  key={dayName} 
                  className={`
                    text-center text-xs font-medium py-1 min-w-[36px] transition-colors duration-150
                    ${isMonthViewExpanded 
                      ? 'text-gray-500' 
                      : isColumnSelected 
                        ? 'text-white bg-blue-500 rounded-t-md' 
                        : isColumnToday 
                          ? 'text-blue-600 bg-blue-50/80 rounded-t-md'
                          : 'text-gray-500'
                    }
                  `}
                >
                  {dayName}
                </div>
              )
            })}
          </div>

          {/* Row-Based Calendar Days */}
          <div className="w-full max-w-sm">
            {monthRows.map((rowDates, rowIndex) => {
              const isCurrentWeekRow = rowIndex === currentWeekRowIndex
              
              // Calculate stagger delay for non-current-week rows
              const staggerDelay = isMonthViewExpanded && !isCurrentWeekRow 
                ? 0.2 + (Math.abs(rowIndex - currentWeekRowIndex) * 0.08) // Increased base delay and multiplier
                : 0

              // In week mode, only show current week row
              if (!isMonthViewExpanded && !isCurrentWeekRow) return null

              return (
                <motion.div
                  key={`row-${rowIndex}-${isMonthViewExpanded}`}
                  initial={
                    isCurrentWeekRow 
                      ? { opacity: 1, y: currentWeekInitialOffset } // Start offset to appear at week position
                      : { opacity: 0, y: -10 } // Other rows start hidden and slightly above
                  }
                  animate={{ 
                    opacity: 1,
                    y: 0 // All rows animate to their natural positions
                  }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1],
                    type: "tween",
                    delay: staggerDelay
                  }}
                  className="grid grid-cols-7 gap-0.5 sm:gap-1"
                >
                  {rowDates.map((date) => {
                    const dayNumber = format(date, 'd')
                    const selected = isSelected(date)
                    const today = isToday(date)
                    const outsideMonth = isMonthViewExpanded && isOutsideMonth(date)

                    return (
                      <button
                        key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
                        onClick={() => onDateSelect(date)}
                        className={`
                          relative transition-colors duration-150 min-w-[36px] min-h-[36px]
                          flex items-center justify-center p-1
                          ${isMonthViewExpanded 
                            ? 'rounded-md' 
                            : selected || today 
                              ? 'rounded-b-md' 
                              : 'rounded-md'
                          }
                          ${getDateButtonClasses(selected, today)}
                          ${outsideMonth ? 'opacity-40' : 'opacity-100'}
                        `}
                      >
                        <span
                          className={`text-sm font-medium ${
                            selected ? 'text-white' : today ? 'text-blue-700' : outsideMonth ? 'text-gray-400' : 'text-gray-900'
                          }`}
                        >
                          {dayNumber}
                        </span>
                      </button>
                    )
                  })}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Next Week/Month Button */}
        <NavigationButton 
          onClick={isMonthViewExpanded ? goToNextMonth : goToNextWeek}
          direction="next"
          aria-label={isMonthViewExpanded ? "Next month" : "Next week"}
        />
      </div>
    </div>
  )
}