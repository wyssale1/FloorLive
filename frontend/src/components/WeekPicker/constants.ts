export const WEEK_PICKER_CONSTANTS = {
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
