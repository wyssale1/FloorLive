import { getDay, addDays } from "date-fns";
import { WEEK_PICKER_CONSTANTS } from "./constants";

// Utility function to calculate the same day of week in a different week
export const calculateSameDayInWeek = (
    selectedDate: Date,
    newWeekStart: Date
): Date => {
    const selectedDayOfWeek = getDay(selectedDate); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = selectedDayOfWeek === 0 ? 6 : selectedDayOfWeek - 1; // Convert to Monday = 0
    return addDays(newWeekStart, mondayOffset);
};

// Helper function for date button classes
export const getDateButtonClasses = (selected: boolean, today: boolean): string => {
    if (selected) {
        return "bg-blue-500 text-white hover:bg-blue-600 rounded-md";
    }

    if (today) {
        return "bg-blue-50/80 text-blue-700 hover:bg-blue-100/80 rounded-md";
    }

    return "hover:bg-gray-50 text-gray-700 rounded-md";
};

// Calculate offset to make current week start at exact week view position
export const calculateCurrentWeekOffset = (
    isMonthViewExpanded: boolean,
    currentWeekRowIndex: number
): number => {
    if (!isMonthViewExpanded) return 0;

    const finetuneOffset =
        WEEK_PICKER_CONSTANTS.WEEK_ROW_OFFSETS[
        currentWeekRowIndex as keyof typeof WEEK_PICKER_CONSTANTS.WEEK_ROW_OFFSETS
        ] ?? 2;

    return (
        -(currentWeekRowIndex * WEEK_PICKER_CONSTANTS.DIMENSIONS.MONTH_ROW_HEIGHT) +
        finetuneOffset
    );
};

// Calculate stagger delays for animations
export const calculateStaggerDelays = (
    isMonthViewExpanded: boolean,
    isCurrentWeekRow: boolean,
    isClosing: boolean,
    rowIndex: number,
    currentWeekRowIndex: number
) => {
    const staggerDelay =
        isMonthViewExpanded && !isCurrentWeekRow && !isClosing
            ? WEEK_PICKER_CONSTANTS.ANIMATIONS.STAGGER_BASE_DELAY +
            Math.abs(rowIndex - currentWeekRowIndex) *
            WEEK_PICKER_CONSTANTS.ANIMATIONS.STAGGER_INCREMENT
            : 0;

    const closingStaggerDelay =
        isClosing && !isCurrentWeekRow
            ? WEEK_PICKER_CONSTANTS.ANIMATIONS.CLOSING_STAGGER_BASE +
            Math.abs(rowIndex - currentWeekRowIndex) *
            WEEK_PICKER_CONSTANTS.ANIMATIONS.CLOSING_STAGGER_INCREMENT
            : 0;

    return { staggerDelay, closingStaggerDelay };
};

// Create reusable animation transition config
export const createAnimationTransition = (
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
export const getDateTextColor = (
    selected: boolean,
    today: boolean,
    outsideMonth: boolean,
    shouldShowMonthUI: boolean
): string => {
    if (selected && !shouldShowMonthUI) {
        return WEEK_PICKER_CONSTANTS.COLORS.WHITE;
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
export const getDayNameColor = (selected: boolean, today: boolean): string => {
    if (selected) {
        return WEEK_PICKER_CONSTANTS.COLORS.WHITE;
    }
    if (today) {
        return WEEK_PICKER_CONSTANTS.COLORS.BLUE_PRIMARY;
    }
    return WEEK_PICKER_CONSTANTS.COLORS.GRAY_600;
};

// Get color for day names header animation
export const getDayNamesHeaderColor = (
    isMonthViewExpanded: boolean,
    isClosing: boolean,
    isOpening: boolean,
    isDaySelected: boolean,
    isDayToday: boolean
): string => {
    if (isMonthViewExpanded && isClosing) {
        return isDaySelected
            ? WEEK_PICKER_CONSTANTS.COLORS.WHITE
            : isDayToday
                ? WEEK_PICKER_CONSTANTS.COLORS.BLUE_PRIMARY
                : WEEK_PICKER_CONSTANTS.COLORS.GRAY_600;
    }

    if (isMonthViewExpanded && isOpening) {
        return WEEK_PICKER_CONSTANTS.COLORS.GRAY_600;
    }

    return WEEK_PICKER_CONSTANTS.COLORS.GRAY_600;
};
