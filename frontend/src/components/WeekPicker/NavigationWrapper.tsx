import { ChevronLeft, ChevronRight } from "lucide-react";
import { m } from "framer-motion";
import { memo } from "react";
import { WEEK_PICKER_CONSTANTS } from "./constants";
import { createAnimationTransition } from "./utils";

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

interface NavigationWrapperProps {
    shouldShowMonthUI: boolean;
    onClick: () => void;
    direction: "previous" | "next";
    ariaLabel: string;
}

export const NavigationWrapper = memo(
    ({
        shouldShowMonthUI,
        onClick,
        direction,
        ariaLabel,
    }: NavigationWrapperProps) => (
        <m.div
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
        </m.div>
    )
);

NavigationWrapper.displayName = "NavigationWrapper";
