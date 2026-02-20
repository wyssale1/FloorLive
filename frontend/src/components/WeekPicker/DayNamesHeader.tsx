import { m } from "framer-motion";
import { memo } from "react";
import { WEEK_PICKER_CONSTANTS } from "./constants";
import { createAnimationTransition, getDayNamesHeaderColor } from "./utils";

interface DayNamesHeaderProps {
    isMonthViewExpanded: boolean;
    isClosing: boolean;
    isOpening: boolean;
    weekDays: Date[];
    isSelected: (date: Date) => boolean;
    isToday: (date: Date) => boolean;
}

export const DayNamesHeader = memo(
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
                        <m.div
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
                        </m.div>
                    );
                })}
            </div>
        );
    }
);
DayNamesHeader.displayName = "DayNamesHeader";
