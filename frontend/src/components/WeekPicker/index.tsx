import { useState, useEffect } from "react";
import { format, startOfWeek } from "date-fns";
import { m } from "framer-motion";
import { Calendar as CalendarIcon } from "lucide-react";

import { WEEK_PICKER_CONSTANTS } from "./constants";
import { useWeekPickerDateCalculations, useWeekPickerNavigation } from "./useWeekPicker";
import { NavigationWrapper } from "./NavigationWrapper";
import { DayNamesHeader } from "./DayNamesHeader";
import {
    calculateCurrentWeekOffset,
    calculateStaggerDelays,
    createAnimationTransition,
    getDateButtonClasses,
    getDayNameColor,
    getDateTextColor,
} from "./utils";

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
                        className={`text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 hover:bg-blue-50 rounded transition-all duration-200 ${isTodaySelected ? "opacity-0 pointer-events-none" : "opacity-100"
                            }`}
                    >
                        Today
                    </button>
                    <button
                        onClick={toggleMonthView}
                        className={`p-1.5 rounded-lg transition-all duration-200 flex items-center justify-center min-h-[28px] min-w-[28px] ${isMonthViewExpanded
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
                <m.div
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
                                <m.div
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
                                            <m.button
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
                          ${isMonthViewExpanded
                                                        ? `min-h-[${WEEK_PICKER_CONSTANTS.DIMENSIONS.MONTH_BUTTON_MIN_HEIGHT}px] flex items-center justify-center` // Month view: center the date
                                                        : `min-h-[${WEEK_PICKER_CONSTANTS.DIMENSIONS.WEEK_BUTTON_MIN_HEIGHT}px] flex flex-col items-center justify-center py-1` // Week view: stack day name and date vertically
                                                    }
                          ${getDateButtonClasses(selected, today)}
                          ${outsideMonth ? "opacity-40" : "opacity-100"}
                        `}
                                            >
                                                {/* Week view: Show day name above date */}
                                                {!isMonthViewExpanded && (
                                                    <m.span
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
                                                    </m.span>
                                                )}

                                                {/* Date number */}
                                                <m.span
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
                                                </m.span>
                                            </m.button>
                                        );
                                    })}
                                </m.div>
                            );
                        })}
                    </div>
                </m.div>

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
