import { useMemo, useCallback } from "react";
import {
    addDays,
    startOfWeek,
    isSameDay,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
} from "date-fns";
import { WEEK_PICKER_CONSTANTS } from "./constants";
import { calculateSameDayInWeek } from "./utils";

export const useWeekPickerDateCalculations = (
    selectedDate: Date,
    currentWeekStart: Date,
    isMonthViewExpanded: boolean
) => {
    const weekDays = useMemo(
        () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
        [currentWeekStart]
    );

    const monthDays = useMemo(() => {
        if (!isMonthViewExpanded) return [];

        const monthStart = startOfMonth(selectedDate);
        const monthEnd = endOfMonth(selectedDate);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calendarEnd = addDays(startOfWeek(monthEnd, { weekStartsOn: 1 }), 41);

        return eachDayOfInterval({
            start: calendarStart,
            end: calendarEnd,
        }).slice(0, 42);
    }, [selectedDate, isMonthViewExpanded]);

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

    const monthRows = useMemo(() => {
        if (!isMonthViewExpanded) {
            return [weekDays];
        }

        const rows: Date[][] = [];
        for (let i = 0; i < monthDays.length; i += 7) {
            rows.push(monthDays.slice(i, i + 7));
        }
        return rows;
    }, [isMonthViewExpanded, weekDays, monthDays]);

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

export const useWeekPickerNavigation = (
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
        setIsMonthNavigation(true);
        const newDate = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth() - 1,
            selectedDate.getDate()
        );
        const newWeekStart = startOfWeek(newDate, { weekStartsOn: 1 });
        setCurrentWeekStart(newWeekStart);
        onDateSelect(newDate);
        setTimeout(() => setIsMonthNavigation(false), 50);
    }, [selectedDate, setCurrentWeekStart, onDateSelect, setIsMonthNavigation]);

    const goToNextMonth = useCallback(() => {
        setIsMonthNavigation(true);
        const newDate = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth() + 1,
            selectedDate.getDate()
        );
        const newWeekStart = startOfWeek(newDate, { weekStartsOn: 1 });
        setCurrentWeekStart(newWeekStart);
        onDateSelect(newDate);
        setTimeout(() => setIsMonthNavigation(false), 50);
    }, [selectedDate, setCurrentWeekStart, onDateSelect, setIsMonthNavigation]);

    const goToToday = useCallback(() => {
        const today = new Date();
        setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
        onDateSelect(today);
    }, [setCurrentWeekStart, onDateSelect]);

    const toggleMonthView = useCallback(() => {
        if (isMonthViewExpanded) {
            setIsClosing(true);
            setIsOpening(false);
            setShouldShowMonthUI(false);
            setTimeout(() => {
                setIsMonthViewExpanded(false);
                setIsClosing(false);
            }, WEEK_PICKER_CONSTANTS.ANIMATIONS.TOTAL_CLOSE_DURATION);
        } else {
            setIsOpening(true);
            setShouldShowMonthUI(true);
            setIsMonthViewExpanded(true);
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
