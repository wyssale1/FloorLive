import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  format,
  addDays,
  startOfWeek,
  isSameDay,
  getDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import { motion } from "framer-motion";

// Utility function to calculate the same day of week in a different week
const calculateSameDayInWeek = (
  selectedDate: Date,
  newWeekStart: Date
): Date => {
  const selectedDayOfWeek = getDay(selectedDate); // 0 = Sunday, 1 = Monday, etc.
  const mondayOffset = selectedDayOfWeek === 0 ? 6 : selectedDayOfWeek - 1; // Convert to Monday = 0
  return addDays(newWeekStart, mondayOffset);
};

// Navigation button component for consistent styling
interface NavigationButtonProps {
  onClick: () => void;
  direction: "previous" | "next";
  "aria-label": string;
}

const NavigationButton = ({
  onClick,
  direction,
  "aria-label": ariaLabel,
}: NavigationButtonProps) => {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;

  return (
    <button
      onClick={onClick}
      className="p-1.5 -mx-1.5 sm:-mx-1 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors duration-150 touch-manipulation flex items-center justify-center min-h-[36px] min-w-[36px]"
      aria-label={ariaLabel}
    >
      <Icon className="w-5 h-5 text-gray-600" />
    </button>
  );
};

// Helper function for date button classes
const getDateButtonClasses = (selected: boolean, today: boolean): string => {
  if (selected) {
    return "bg-blue-500 text-white hover:bg-blue-600 rounded-md";
  }

  if (today) {
    return "bg-blue-50/80 text-blue-700 hover:bg-blue-100/80 rounded-md";
  }

  return "hover:bg-gray-50 text-gray-700 rounded-md";
};

interface WeekPickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export default function WeekPicker({
  selectedDate,
  onDateSelect,
}: WeekPickerProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    () => startOfWeek(selectedDate, { weekStartsOn: 1 }) // Monday start
  );
  const [isMonthViewExpanded, setIsMonthViewExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldShowMonthUI, setShouldShowMonthUI] = useState(false); // Controls immediate UI changes (box/arrow)

  // Sync currentWeekStart with selectedDate changes
  useEffect(() => {
    const newWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    if (newWeekStart.getTime() !== currentWeekStart.getTime()) {
      setCurrentWeekStart(newWeekStart);
    }
  }, [selectedDate, currentWeekStart]);

  // Get all 7 days of the current week
  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(currentWeekStart, i)
  );

  // Get all days for the full month view (including padding days)
  const getMonthDays = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = addDays(startOfWeek(monthEnd, { weekStartsOn: 1 }), 41); // 6 weeks * 7 days - 1

    return eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    }).slice(0, 42); // Ensure exactly 6 rows
  };

  const monthDays = isMonthViewExpanded ? getMonthDays() : [];
  const displayDays = isMonthViewExpanded ? monthDays : weekDays;

  const goToPreviousWeek = () => {
    const newWeekStart = addDays(currentWeekStart, -7);
    const newSelectedDate = calculateSameDayInWeek(selectedDate, newWeekStart);

    setCurrentWeekStart(newWeekStart);
    onDateSelect(newSelectedDate);
  };

  const goToNextWeek = () => {
    const newWeekStart = addDays(currentWeekStart, 7);
    const newSelectedDate = calculateSameDayInWeek(selectedDate, newWeekStart);

    setCurrentWeekStart(newWeekStart);
    onDateSelect(newSelectedDate);
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() - 1,
      selectedDate.getDate()
    );
    const newWeekStart = startOfWeek(newDate, { weekStartsOn: 1 });
    setCurrentWeekStart(newWeekStart);
    onDateSelect(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      selectedDate.getDate()
    );
    const newWeekStart = startOfWeek(newDate, { weekStartsOn: 1 });
    setCurrentWeekStart(newWeekStart);
    onDateSelect(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
    onDateSelect(today);
  };

  const toggleMonthView = () => {
    if (isMonthViewExpanded) {
      // Start closing sequence - immediate UI changes
      setIsClosing(true);
      setShouldShowMonthUI(false); // Box/arrow start closing immediately
      // After closing animation completes, actually close
      setTimeout(() => {
        setIsMonthViewExpanded(false);
        setIsClosing(false);
      }, 600); // Total animation time
    } else {
      // Opening - immediate UI changes
      setShouldShowMonthUI(true); // Box/arrow start opening immediately  
      setIsMonthViewExpanded(true);
    }
  };

  const handleMonthDateSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
      onDateSelect(date);
      // Keep month view open for easier navigation
    }
  };

  const isToday = (date: Date) => isSameDay(date, new Date());
  const isSelected = (date: Date) => isSameDay(date, selectedDate);
  const isTodaySelected = isSelected(new Date());
  const isOutsideMonth = (date: Date) => {
    const currentMonth = selectedDate.getMonth();
    return date.getMonth() !== currentMonth;
  };

  const isInSelectedWeek = (date: Date) => {
    return weekDays.some((weekDay) => isSameDay(weekDay, date));
  };

  // Calculate which row in the month grid contains the current week
  const getCurrentWeekRowIndex = () => {
    if (!isMonthViewExpanded) return 0;

    const monthStart = startOfMonth(selectedDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });

    const daysDiff = Math.floor(
      (selectedWeekStart.getTime() - calendarStart.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return Math.floor(daysDiff / 7);
  };

  // Group month days into rows of 7
  const getMonthRows = () => {
    if (!isMonthViewExpanded) {
      return [weekDays]; // In week mode, just one row
    }

    const rows: Date[][] = [];
    for (let i = 0; i < monthDays.length; i += 7) {
      rows.push(monthDays.slice(i, i + 7));
    }
    return rows;
  };

  const monthRows = getMonthRows();
  const currentWeekRowIndex = getCurrentWeekRowIndex();

  // Calculate offset to make current week start at exact week view position
  const calculateCurrentWeekOffset = () => {
    if (!isMonthViewExpanded) return 0;

    // Month view: 44px per row (36px button + 8px gap)
    const monthRowHeight = 44;

    // Lookup table for perfect alignment per week row position
    const offsetByWeekRow: Record<number, number> = {
      0: -6, // First week of month
      1: 2, // Second week of month
      2: 10, // Third week of month
      3: 18, // Fourth week of month
      4: 26, // Fifth week of month
      5: 34, // Sixth week of month (rare)
    };
    const finetuneOffset = offsetByWeekRow[currentWeekRowIndex] ?? 2;

    // In week view, current week sits at y=0 (first row position)
    // In month view, current week sits at y=(currentWeekRowIndex * monthRowHeight)
    // So we need to offset it back to y=0 to match week view position
    return -(currentWeekRowIndex * monthRowHeight) + finetuneOffset;
  };

  const currentWeekInitialOffset = calculateCurrentWeekOffset();

  return (
    <div className="bg-white/60 backdrop-blur-sm border border-gray-100 rounded-lg p-4 mb-6">
      {/* Static Month/Year Header - Never moves */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-600 font-medium">
          {format(currentWeekStart, "MMMM yyyy")}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={isTodaySelected ? undefined : goToToday}
            className={`text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 hover:bg-blue-50 rounded transition-all duration-200 ${
              isTodaySelected ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            Today
          </button>
          <button
            onClick={toggleMonthView}
            className={`p-1.5 rounded-lg transition-all duration-200 flex items-center justify-center min-h-[28px] min-w-[28px] ${
              isMonthViewExpanded
                ? "bg-blue-50 hover:bg-blue-100"
                : "hover:bg-gray-50"
            }`}
            aria-label={
              isMonthViewExpanded ? "Close month view" : "Open month view"
            }
          >
            <CalendarIcon className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      </div>

      {/* Navigation and Calendar Container */}
      <div className="flex items-start justify-center">
        {/* Previous Week/Month Button */}
        <motion.div
          animate={{
            y: shouldShowMonthUI ? 110 : 0 // Move down to center with month view - immediate response
          }}
          transition={{
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
            type: "tween"
          }}
        >
          <NavigationButton
            onClick={isMonthViewExpanded ? goToPreviousMonth : goToPreviousWeek}
            direction="previous"
            aria-label={isMonthViewExpanded ? "Previous month" : "Previous week"}
          />
        </motion.div>

        {/* Layered Animation Calendar */}
        <motion.div 
          className="mx-2 flex flex-col items-center overflow-hidden"
          animate={{
            height: shouldShowMonthUI ? 240 : 60 // Week: ~70px, Month: ~240px - immediate response
          }}
          transition={{
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
            type: "tween",
delay: 0 // No delay - box closes immediately when user clicks
          }}
        >
          {/* Static Day Names Header */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 w-full max-w-sm">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
              (dayName, index) => {
                // In week mode, check if this column's day is selected
                const weekDayForColumn = weekDays[index];
                const isColumnSelected =
                  !isMonthViewExpanded &&
                  weekDayForColumn &&
                  isSelected(weekDayForColumn);
                const isColumnToday =
                  !isMonthViewExpanded &&
                  weekDayForColumn &&
                  isToday(weekDayForColumn);

                return (
                  <div
                    key={dayName}
                    className={`
                    text-center text-xs font-medium py-1 min-w-[36px] transition-colors duration-150 relative z-10
                    ${
                      isMonthViewExpanded
                        ? "text-gray-500"
                        : isColumnSelected
                        ? "text-white"
                        : isColumnToday
                        ? "text-blue-600"
                        : "text-gray-500"
                    }
                  `}
                  >
                    {dayName}
                  </div>
                );
              }
            )}
          </div>

          {/* Row-Based Calendar Days */}
          <div className="w-full max-w-sm">
            {monthRows.map((rowDates, rowIndex) => {
              const isCurrentWeekRow = rowIndex === currentWeekRowIndex;

              // Calculate stagger delay for non-current-week rows (entrance)
              const staggerDelay =
                isMonthViewExpanded && !isCurrentWeekRow && !isClosing
                  ? 0.1 + Math.abs(rowIndex - currentWeekRowIndex) * 0.04 // Faster stagger timing
                  : 0;

              // Calculate closing stagger delay (reverse order - closest rows disappear first)
              const closingStaggerDelay = 
                isClosing && !isCurrentWeekRow
                  ? 0.05 + Math.abs(rowIndex - currentWeekRowIndex) * 0.03
                  : 0;

              // In week mode, only show current week row
              if (!isMonthViewExpanded && !isCurrentWeekRow) return null;

              return (
                <motion.div
                  key={`row-${rowIndex}-${isMonthViewExpanded}`}
                  initial={
                    isCurrentWeekRow
                      ? { opacity: 1, y: currentWeekInitialOffset } // Start offset to appear at week position
                      : { opacity: 0, y: -10 } // Other rows start hidden and slightly above
                  }
                  animate={{
                    opacity: isClosing && !isCurrentWeekRow ? 0 : 1, // Non-current rows fade out when closing
                    y: isClosing && isCurrentWeekRow 
                      ? currentWeekInitialOffset 
                      : isClosing && !isCurrentWeekRow 
                        ? -20 // Non-current rows move up while fading
                        : 0 // Normal position
                  }}
                  transition={{
                    duration: isClosing && !isCurrentWeekRow ? 0.2 : 0.4,
                    ease: [0.4, 0, 0.2, 1],
                    type: "tween",
                    delay: isClosing ? closingStaggerDelay : staggerDelay,
                  }}
                  className="grid grid-cols-7 gap-0.5 sm:gap-1"
                >
                  {rowDates.map((date) => {
                    const dayNumber = format(date, "d");
                    const selected = isSelected(date);
                    const today = isToday(date);
                    const outsideMonth =
                      isMonthViewExpanded && isOutsideMonth(date);

                    return (
                      <motion.button
                        key={`date-button-${isMonthViewExpanded}`}
                        onClick={() => onDateSelect(date)}
                        initial={
                          // Only animate in month view, week view uses CSS classes
                          isMonthViewExpanded && (selected || today)
                            ? { marginTop: -18, paddingTop: 24 } // Start with tall height (like week view)
                            : isMonthViewExpanded
                            ? { marginTop: 0, paddingTop: 4 } // Normal height for unselected
                            : false // Week view: no motion, use CSS classes
                        }
                        animate={
                          // Animate based on view state and closing state
                          isMonthViewExpanded && !isClosing
                            ? { marginTop: 0, paddingTop: 0 } // Opening: animate to normal height
                            : isClosing && (selected || today)
                              ? { marginTop: -24, paddingTop: 24 } // Closing: grow back to tall height
                              : false // Week view: no motion
                        }
                        transition={{
                          duration: 0.4,
                          ease: [0.4, 0, 0.2, 1],
                          type: "tween",
                          delay: !shouldShowMonthUI && (selected || today) ? 0.1 : 0 // Delay for blue selector growth - you can adjust this!
                        }}
                        className={`
                          relative min-w-[36px] transition-colors duration-150
                          flex items-center justify-center
                          ${
                            isMonthViewExpanded
                              ? "min-h-[36px]" // Month view height (motion handles positioning)
                              : "min-h-[28px] -mt-6 pt-6" // Week view: all buttons have full clickable height
                          }
                          ${getDateButtonClasses(selected, today)}
                          ${outsideMonth ? "opacity-40" : "opacity-100"}
                        `}
                      >
                        <motion.span
                          animate={{
                            color: selected && !shouldShowMonthUI ? "#ffffff" : // White immediately when closing month view, but only if SELECTED
                                   selected ? "#ffffff" : 
                                   today ? "#1d4ed8" : 
                                   outsideMonth ? "#9ca3af" : "#111827"
                          }}
                          transition={{
                            duration: 0.2,
                            delay: 0 // No delay - text changes immediately when user clicks!
                          }}
                          className="text-sm font-medium"
                        >
                          {dayNumber}
                        </motion.span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Next Week/Month Button */}
        <motion.div
          animate={{
            y: shouldShowMonthUI ? 110 : 0 // Move down to center with month view - immediate response
          }}
          transition={{
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
            type: "tween"
          }}
        >
          <NavigationButton
            onClick={isMonthViewExpanded ? goToNextMonth : goToNextWeek}
            direction="next"
            aria-label={isMonthViewExpanded ? "Next month" : "Next week"}
          />
        </motion.div>
      </div>
    </div>
  );
}
