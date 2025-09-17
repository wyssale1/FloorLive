import { useState, useEffect, useMemo, useCallback, memo } from "react";
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

// Constants
const WEEK_PICKER_CONSTANTS = {
  // Day names array (single source of truth)
  DAY_NAMES: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const,

  // Colors (centralized color palette)
  COLORS: {
    WHITE: "#ffffff",
    BLUE_PRIMARY: "#1d4ed8",
    GRAY_600: "#6b7280",
    GRAY_400: "#9ca3af",
    GRAY_900: "#111827",
  } as const,

  // Dimensions
  DIMENSIONS: {
    MONTH_ROW_HEIGHT: 44,
    WEEK_VIEW_HEIGHT: 60,
    MONTH_VIEW_HEIGHT: 240,
    NAVIGATION_OFFSET: 110,
    BUTTON_MIN_WIDTH: 36,
    WEEK_BUTTON_MIN_HEIGHT: 44,
    MONTH_BUTTON_MIN_HEIGHT: 36,
  } as const,

  // Animation configurations
  ANIMATIONS: {
    DEFAULT_DURATION: 0.4,
    FAST_DURATION: 0.2,
    DEFAULT_EASE: [0.4, 0, 0.2, 1] as const,
    TOTAL_CLOSE_DURATION: 600,
    STAGGER_BASE_DELAY: 0.1,
    STAGGER_INCREMENT: 0.04,
    CLOSING_STAGGER_BASE: 0.05,
    CLOSING_STAGGER_INCREMENT: 0.03,
  } as const,

  // Week row offset lookup table
  WEEK_ROW_OFFSETS: {
    0: -12, // First week of month
    1: -4, // Second week of month
    2: 4, // Third week of month
    3: 12, // Fourth week of month
    4: 20, // Fifth week of month
    5: 28, // Sixth week of month (rare)
  } as const,
} as const;

// TypeScript interfaces

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

// Custom Hooks

// Hook for date calculations and state
const useWeekPickerDateCalculations = (
  selectedDate: Date,
  currentWeekStart: Date,
  isMonthViewExpanded: boolean
) => {
  // Get all 7 days of the current week (memoized)
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  );

  // Get all days for the full month view (memoized and only when needed)
  const monthDays = useMemo(() => {
    if (!isMonthViewExpanded) return [];

    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = addDays(startOfWeek(monthEnd, { weekStartsOn: 1 }), 41);

    return eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    }).slice(0, 42); // Ensure exactly 6 rows
  }, [selectedDate, isMonthViewExpanded]);

  // Calculate which row in the month grid contains the current week (memoized)
  const currentWeekRowIndex = useMemo(() => {
    if (!isMonthViewExpanded) return 0;

    const monthStart = startOfMonth(selectedDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const selectedWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });

    const daysDiff = Math.floor(
      (selectedWeekStart.getTime() - calendarStart.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return Math.floor(daysDiff / 7);
  }, [selectedDate, isMonthViewExpanded]);

  // Group month days into rows of 7 (memoized)
  const monthRows = useMemo(() => {
    if (!isMonthViewExpanded) {
      return [weekDays]; // In week mode, just one row
    }

    const rows: Date[][] = [];
    for (let i = 0; i < monthDays.length; i += 7) {
      rows.push(monthDays.slice(i, i + 7));
    }
    return rows;
  }, [isMonthViewExpanded, weekDays, monthDays]);

  // Helper functions (memoized)
  const isToday = useCallback((date: Date) => isSameDay(date, new Date()), []);
  const isSelected = useCallback(
    (date: Date) => isSameDay(date, selectedDate),
    [selectedDate]
  );
  const isTodaySelected = useMemo(() => isSelected(new Date()), [isSelected]);
  const isOutsideMonth = useCallback(
    (date: Date) => {
      const currentMonth = selectedDate.getMonth();
      return date.getMonth() !== currentMonth;
    },
    [selectedDate]
  );

  return {
    weekDays,
    monthDays,
    monthRows,
    currentWeekRowIndex,
    isToday,
    isSelected,
    isTodaySelected,
    isOutsideMonth,
  };
};

// Hook for navigation handlers
const useWeekPickerNavigation = (
  selectedDate: Date,
  currentWeekStart: Date,
  setCurrentWeekStart: (date: Date) => void,
  onDateSelect: (date: Date) => void,
  isMonthViewExpanded: boolean,
  setIsMonthViewExpanded: (value: boolean) => void,
  setIsClosing: (value: boolean) => void,
  setIsOpening: (value: boolean) => void,
  setShouldShowMonthUI: (value: boolean) => void,
  setIsMonthNavigation: (value: boolean) => void
) => {
  const goToPreviousWeek = useCallback(() => {
    const newWeekStart = addDays(currentWeekStart, -7);
    const newSelectedDate = calculateSameDayInWeek(selectedDate, newWeekStart);

    setCurrentWeekStart(newWeekStart);
    onDateSelect(newSelectedDate);
  }, [currentWeekStart, selectedDate, setCurrentWeekStart, onDateSelect]);

  const goToNextWeek = useCallback(() => {
    const newWeekStart = addDays(currentWeekStart, 7);
    const newSelectedDate = calculateSameDayInWeek(selectedDate, newWeekStart);

    setCurrentWeekStart(newWeekStart);
    onDateSelect(newSelectedDate);
  }, [currentWeekStart, selectedDate, setCurrentWeekStart, onDateSelect]);

  const goToPreviousMonth = useCallback(() => {
    setIsMonthNavigation(true); // Set flag before navigation
    const newDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() - 1,
      selectedDate.getDate()
    );
    const newWeekStart = startOfWeek(newDate, { weekStartsOn: 1 });
    setCurrentWeekStart(newWeekStart);
    onDateSelect(newDate);
    // Clear flag after a short delay to allow re-render
    setTimeout(() => setIsMonthNavigation(false), 50);
  }, [selectedDate, setCurrentWeekStart, onDateSelect, setIsMonthNavigation]);

  const goToNextMonth = useCallback(() => {
    setIsMonthNavigation(true); // Set flag before navigation
    const newDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      selectedDate.getDate()
    );
    const newWeekStart = startOfWeek(newDate, { weekStartsOn: 1 });
    setCurrentWeekStart(newWeekStart);
    onDateSelect(newDate);
    // Clear flag after a short delay to allow re-render
    setTimeout(() => setIsMonthNavigation(false), 50);
  }, [selectedDate, setCurrentWeekStart, onDateSelect, setIsMonthNavigation]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
    onDateSelect(today);
  }, [setCurrentWeekStart, onDateSelect]);

  const toggleMonthView = useCallback(() => {
    if (isMonthViewExpanded) {
      // Start closing sequence - immediate UI changes
      setIsClosing(true);
      setIsOpening(false); // Clear opening state
      setShouldShowMonthUI(false); // Box/arrow start closing immediately
      // After closing animation completes, actually close
      setTimeout(() => {
        setIsMonthViewExpanded(false);
        setIsClosing(false);
      }, WEEK_PICKER_CONSTANTS.ANIMATIONS.TOTAL_CLOSE_DURATION); // Total animation time
    } else {
      // Opening - immediate UI changes
      setIsOpening(true); // Set opening state for animations
      setShouldShowMonthUI(true); // Box/arrow start opening immediately
      setIsMonthViewExpanded(true);
      // Clear opening state after animation completes
      setTimeout(() => {
        setIsOpening(false);
      }, WEEK_PICKER_CONSTANTS.ANIMATIONS.TOTAL_CLOSE_DURATION);
    }
  }, [
    isMonthViewExpanded,
    setIsClosing,
    setIsOpening,
    setShouldShowMonthUI,
    setIsMonthViewExpanded,
  ]);

  return {
    goToPreviousWeek,
    goToNextWeek,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    toggleMonthView,
  };
};

// Helper Functions

// Calculate offset to make current week start at exact week view position
const calculateCurrentWeekOffset = (
  isMonthViewExpanded: boolean,
  currentWeekRowIndex: number
): number => {
  if (!isMonthViewExpanded) return 0;

  const finetuneOffset =
    WEEK_PICKER_CONSTANTS.WEEK_ROW_OFFSETS[
      currentWeekRowIndex as keyof typeof WEEK_PICKER_CONSTANTS.WEEK_ROW_OFFSETS
    ] ?? 2;

  // In week view, current week sits at y=0 (first row position)
  // In month view, current week sits at y=(currentWeekRowIndex * monthRowHeight)
  // So we need to offset it back to y=0 to match week view position
  return (
    -(currentWeekRowIndex * WEEK_PICKER_CONSTANTS.DIMENSIONS.MONTH_ROW_HEIGHT) +
    finetuneOffset
  );
};

// Calculate stagger delays for animations
const calculateStaggerDelays = (
  isMonthViewExpanded: boolean,
  isCurrentWeekRow: boolean,
  isClosing: boolean,
  rowIndex: number,
  currentWeekRowIndex: number
) => {
  // Calculate stagger delay for non-current-week rows (entrance)
  const staggerDelay =
    isMonthViewExpanded && !isCurrentWeekRow && !isClosing
      ? WEEK_PICKER_CONSTANTS.ANIMATIONS.STAGGER_BASE_DELAY +
        Math.abs(rowIndex - currentWeekRowIndex) *
          WEEK_PICKER_CONSTANTS.ANIMATIONS.STAGGER_INCREMENT
      : 0;

  // Calculate closing stagger delay (reverse order - closest rows disappear first)
  const closingStaggerDelay =
    isClosing && !isCurrentWeekRow
      ? WEEK_PICKER_CONSTANTS.ANIMATIONS.CLOSING_STAGGER_BASE +
        Math.abs(rowIndex - currentWeekRowIndex) *
          WEEK_PICKER_CONSTANTS.ANIMATIONS.CLOSING_STAGGER_INCREMENT
      : 0;

  return { staggerDelay, closingStaggerDelay };
};

// Create reusable animation transition config
const createAnimationTransition = (
  duration: number = WEEK_PICKER_CONSTANTS.ANIMATIONS.DEFAULT_DURATION,
  delay: number = 0,
  ease = WEEK_PICKER_CONSTANTS.ANIMATIONS.DEFAULT_EASE
) => ({
  duration,
  ease,
  type: "tween" as const,
  delay,
});

// Get color for date text based on state
const getDateTextColor = (
  selected: boolean,
  today: boolean,
  outsideMonth: boolean,
  shouldShowMonthUI: boolean
): string => {
  if (selected && !shouldShowMonthUI) {
    return WEEK_PICKER_CONSTANTS.COLORS.WHITE; // White immediately when closing month view, but only if SELECTED
  }
  if (selected) {
    return WEEK_PICKER_CONSTANTS.COLORS.WHITE;
  }
  if (today) {
    return WEEK_PICKER_CONSTANTS.COLORS.BLUE_PRIMARY;
  }
  if (outsideMonth) {
    return WEEK_PICKER_CONSTANTS.COLORS.GRAY_400;
  }
  return WEEK_PICKER_CONSTANTS.COLORS.GRAY_900;
};

// Get color for day name text based on state
const getDayNameColor = (selected: boolean, today: boolean): string => {
  if (selected) {
    return WEEK_PICKER_CONSTANTS.COLORS.WHITE;
  }
  if (today) {
    return WEEK_PICKER_CONSTANTS.COLORS.BLUE_PRIMARY;
  }
  return WEEK_PICKER_CONSTANTS.COLORS.GRAY_600;
};

// Get color for day names header animation
const getDayNamesHeaderColor = (
  isMonthViewExpanded: boolean,
  isClosing: boolean,
  isOpening: boolean,
  isDaySelected: boolean,
  isDayToday: boolean
): string => {
  // Closing animation: selected → white, today → blue
  if (isMonthViewExpanded && isClosing) {
    return isDaySelected
      ? WEEK_PICKER_CONSTANTS.COLORS.WHITE
      : isDayToday
      ? WEEK_PICKER_CONSTANTS.COLORS.BLUE_PRIMARY
      : WEEK_PICKER_CONSTANTS.COLORS.GRAY_600;
  }

  // Opening animation: selected starts white, today starts blue, both fade to gray
  if (isMonthViewExpanded && isOpening) {
    return WEEK_PICKER_CONSTANTS.COLORS.GRAY_600; // Target color for opening
  }

  // Default state
  return WEEK_PICKER_CONSTANTS.COLORS.GRAY_600;
};

// Component Extractions

// Navigation wrapper component to eliminate duplication
interface NavigationWrapperProps {
  shouldShowMonthUI: boolean;
  onClick: () => void;
  direction: "previous" | "next";
  ariaLabel: string;
}

const NavigationWrapper = memo(
  ({
    shouldShowMonthUI,
    onClick,
    direction,
    ariaLabel,
  }: NavigationWrapperProps) => (
    <motion.div
      animate={{
        y: shouldShowMonthUI
          ? WEEK_PICKER_CONSTANTS.DIMENSIONS.NAVIGATION_OFFSET
          : 0,
      }}
      transition={createAnimationTransition()}
    >
      <NavigationButton
        onClick={onClick}
        direction={direction}
        aria-label={ariaLabel}
      />
    </motion.div>
  )
);
NavigationWrapper.displayName = "NavigationWrapper";

// Day names header component
interface DayNamesHeaderProps {
  isMonthViewExpanded: boolean;
  isClosing: boolean;
  isOpening: boolean;
  weekDays: Date[];
  isSelected: (date: Date) => boolean;
  isToday: (date: Date) => boolean;
}

const DayNamesHeader = memo(
  ({
    isMonthViewExpanded,
    isClosing,
    isOpening,
    weekDays,
    isSelected,
    isToday,
  }: DayNamesHeaderProps) => {
    if (!isMonthViewExpanded) return null;

    return (
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1 w-full max-w-sm z-10">
        {WEEK_PICKER_CONSTANTS.DAY_NAMES.map((dayName, index) => {
          // Calculate which day names should be highlighted based on selected/today
          const dayDate = weekDays[index];
          const isDaySelected = dayDate && isSelected(dayDate);
          const isDayToday = dayDate && isToday(dayDate);

          // Calculate initial color for opening animation
          const getInitialColor = () => {
            if (isOpening && isDaySelected) {
              return WEEK_PICKER_CONSTANTS.COLORS.WHITE; // Start white for selected
            }
            if (isOpening && isDayToday) {
              return WEEK_PICKER_CONSTANTS.COLORS.BLUE_PRIMARY; // Start blue for today
            }
            return WEEK_PICKER_CONSTANTS.COLORS.GRAY_600; // Default gray
          };

          return (
            <motion.div
              initial={{ color: getInitialColor() }}
              animate={{
                color: getDayNamesHeaderColor(
                  isMonthViewExpanded,
                  isClosing,
                  isOpening,
                  isDaySelected,
                  isDayToday
                ),
              }}
              transition={createAnimationTransition(
                isOpening
                  ? WEEK_PICKER_CONSTANTS.ANIMATIONS.FAST_DURATION
                  : WEEK_PICKER_CONSTANTS.ANIMATIONS.DEFAULT_DURATION,
                isClosing
                  ? 0.1
                  : isOpening && (isDaySelected || isDayToday)
                  ? 0.05
                  : 0
              )}
              key={dayName}
              className="text-center text-xs font-medium py-1 min-w-[36px]"
            >
              {dayName}
            </motion.div>
          );
        })}
      </div>
    );
  }
);
DayNamesHeader.displayName = "DayNamesHeader";

interface WeekPickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export default function WeekPicker({
  selectedDate,
  onDateSelect,
}: WeekPickerProps) {
  // State management
  const [currentWeekStart, setCurrentWeekStart] = useState(
    () => startOfWeek(selectedDate, { weekStartsOn: 1 }) // Monday start
  );
  const [isMonthViewExpanded, setIsMonthViewExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [shouldShowMonthUI, setShouldShowMonthUI] = useState(false); // Controls immediate UI changes (box/arrow)
  const [isMonthNavigation, setIsMonthNavigation] = useState(false); // Track month navigation to prevent animation

  // Sync currentWeekStart with selectedDate changes
  useEffect(() => {
    const newWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    if (newWeekStart.getTime() !== currentWeekStart.getTime()) {
      setCurrentWeekStart(newWeekStart);
    }
  }, [selectedDate, currentWeekStart]);

  // Custom hooks for extracted logic
  const dateCalculations = useWeekPickerDateCalculations(
    selectedDate,
    currentWeekStart,
    isMonthViewExpanded
  );
  const navigation = useWeekPickerNavigation(
    selectedDate,
    currentWeekStart,
    setCurrentWeekStart,
    onDateSelect,
    isMonthViewExpanded,
    setIsMonthViewExpanded,
    setIsClosing,
    setIsOpening,
    setShouldShowMonthUI,
    setIsMonthNavigation
  );

  // Destructure for convenience
  const {
    weekDays,
    monthRows,
    currentWeekRowIndex,
    isToday,
    isSelected,
    isTodaySelected,
    isOutsideMonth,
  } = dateCalculations;

  const {
    goToPreviousWeek,
    goToNextWeek,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    toggleMonthView,
  } = navigation;

  // Calculate offset using helper function
  const currentWeekInitialOffset = calculateCurrentWeekOffset(
    isMonthViewExpanded,
    currentWeekRowIndex
  );

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
        <NavigationWrapper
          shouldShowMonthUI={shouldShowMonthUI}
          onClick={isMonthViewExpanded ? goToPreviousMonth : goToPreviousWeek}
          direction="previous"
          ariaLabel={isMonthViewExpanded ? "Previous month" : "Previous week"}
        />

        {/* Layered Animation Calendar */}
        <motion.div
          className="mx-2 flex flex-col items-center overflow-hidden"
          animate={{
            height: shouldShowMonthUI
              ? WEEK_PICKER_CONSTANTS.DIMENSIONS.MONTH_VIEW_HEIGHT
              : WEEK_PICKER_CONSTANTS.DIMENSIONS.WEEK_VIEW_HEIGHT, // Week: ~70px, Month: ~240px - immediate response
          }}
          transition={createAnimationTransition(
            WEEK_PICKER_CONSTANTS.ANIMATIONS.DEFAULT_DURATION,
            0
          )}
        >
          {/* Static Day Names Header - Only shown in month view */}
          <DayNamesHeader
            isMonthViewExpanded={isMonthViewExpanded}
            isClosing={isClosing}
            isOpening={isOpening}
            weekDays={weekDays}
            isSelected={isSelected}
            isToday={isToday}
          />

          {/* Row-Based Calendar Days */}
          <div className="w-full max-w-sm">
            {monthRows.map((rowDates, rowIndex) => {
              const isCurrentWeekRow = rowIndex === currentWeekRowIndex;

              // Calculate stagger delays using helper function
              const { staggerDelay, closingStaggerDelay } =
                calculateStaggerDelays(
                  isMonthViewExpanded,
                  isCurrentWeekRow,
                  isClosing,
                  rowIndex,
                  currentWeekRowIndex
                );

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
                    y:
                      isClosing && isCurrentWeekRow
                        ? currentWeekInitialOffset
                        : isClosing && !isCurrentWeekRow
                        ? -20 // Non-current rows move up while fading
                        : 0, // Normal position
                  }}
                  transition={createAnimationTransition(
                    isClosing && !isCurrentWeekRow
                      ? WEEK_PICKER_CONSTANTS.ANIMATIONS.FAST_DURATION
                      : WEEK_PICKER_CONSTANTS.ANIMATIONS.DEFAULT_DURATION,
                    isClosing ? closingStaggerDelay : staggerDelay
                  )}
                  className="grid grid-cols-7 gap-0.5 sm:gap-1"
                >
                  {rowDates.map((date) => {
                    const dayNumber = format(date, "d");
                    const selected = isSelected(date);
                    const today = isToday(date);
                    const outsideMonth =
                      isMonthViewExpanded && isOutsideMonth(date);

                    // Get day name for week view
                    const dayIndex = rowDates.indexOf(date);
                    const dayName = WEEK_PICKER_CONSTANTS.DAY_NAMES[dayIndex];

                    return (
                      <motion.button
                        key={`date-button-${date.getTime()}-${rowIndex}`}
                        onClick={() => onDateSelect(date)}
                        initial={
                          // Only animate in month view, week view uses CSS classes
                          isMonthViewExpanded && (selected || today)
                            ? { marginTop: -12, paddingTop: 8, marginBottom: 4 } // Start with tall height (like week view)
                            : isMonthViewExpanded
                            ? { marginTop: 0, paddingTop: 4, marginBottom: 0 } // Normal height for unselected
                            : false // Week view: no motion, use CSS classes
                        }
                        animate={
                          // Animate based on view state and closing state
                          isMonthViewExpanded && !isClosing
                            ? { marginTop: 0, paddingTop: 0, marginBottom: 0 } // Opening: animate to normal height
                            : isClosing && (selected || today)
                            ? { marginTop: -12, paddingTop: 8, marginBottom: 4 } // Closing: grow back to tall height
                            : false // Week view: no motion
                        }
                        transition={createAnimationTransition(
                          WEEK_PICKER_CONSTANTS.ANIMATIONS.DEFAULT_DURATION,
                          !shouldShowMonthUI && (selected || today) ? 0.1 : 0 // Delay for blue selector growth
                        )}
                        className={`
                          relative min-w-[36px] transition-colors duration-150
                          ${
                            isMonthViewExpanded
                              ? `min-h-[${WEEK_PICKER_CONSTANTS.DIMENSIONS.MONTH_BUTTON_MIN_HEIGHT}px] flex items-center justify-center` // Month view: center the date
                              : `min-h-[${WEEK_PICKER_CONSTANTS.DIMENSIONS.WEEK_BUTTON_MIN_HEIGHT}px] flex flex-col items-center justify-center py-1` // Week view: stack day name and date vertically
                          }
                          ${getDateButtonClasses(selected, today)}
                          ${outsideMonth ? "opacity-40" : "opacity-100"}
                        `}
                      >
                        {/* Week view: Show day name above date */}
                        {!isMonthViewExpanded && (
                          <motion.span
                            animate={{
                              color: getDayNameColor(selected, today),
                            }}
                            transition={createAnimationTransition(
                              WEEK_PICKER_CONSTANTS.ANIMATIONS.FAST_DURATION,
                              0
                            )}
                            className="text-xs font-medium"
                          >
                            {dayName}
                          </motion.span>
                        )}

                        {/* Date number */}
                        <motion.span
                          initial={
                            // Only animate in month view, week view uses CSS classes
                            // Skip animation if it's month navigation within expanded month view
                            (isMonthNavigation && isMonthViewExpanded)
                              ? {
                                  // Match exactly what animate will be to prevent jump
                                  color: getDateTextColor(
                                    selected,
                                    today,
                                    outsideMonth,
                                    shouldShowMonthUI
                                  ),
                                  y: 0, // Match animate y value for month navigation
                                }
                              : isMonthViewExpanded && selected
                              ? {
                                  color: WEEK_PICKER_CONSTANTS.COLORS.WHITE,
                                  y: 4,
                                } // Start white for selected
                              : isMonthViewExpanded && today
                              ? {
                                  color: WEEK_PICKER_CONSTANTS.COLORS.BLUE_PRIMARY,
                                  y: 4,
                                } // Start blue for today
                              : false // Week view: no motion, use CSS classes
                          }
                          animate={{
                            color: getDateTextColor(
                              selected,
                              today,
                              outsideMonth,
                              shouldShowMonthUI
                            ),
                            y:
                              isMonthViewExpanded &&
                              isClosing &&
                              (selected || today)
                                ? 4
                                : 0, // No vertical movement for now
                          }}
                          transition={createAnimationTransition(
                            WEEK_PICKER_CONSTANTS.ANIMATIONS.FAST_DURATION,
                            0 // No delay - text changes immediately when user clicks!
                          )}
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
        <NavigationWrapper
          shouldShowMonthUI={shouldShowMonthUI}
          onClick={isMonthViewExpanded ? goToNextMonth : goToNextWeek}
          direction="next"
          ariaLabel={isMonthViewExpanded ? "Next month" : "Next week"}
        />
      </div>
    </div>
  );
}
