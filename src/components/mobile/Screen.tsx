import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Standard screen container — gives every page consistent safe-area
 * handling, max-width clamp, and dynamic viewport height. Maps 1:1
 * to a React Native <SafeAreaView> later.
 */
interface ScreenProps {
  children: ReactNode;
  className?: string;
  /** When true, fills the viewport (use for chat/full-screen pages). */
  fullHeight?: boolean;
  /** When true, adds bottom padding to clear the BottomNav. */
  withBottomNav?: boolean;
  /** When true, adds top safe-area padding. */
  withSafeTop?: boolean;
}

const Screen = ({
  children,
  className,
  fullHeight,
  withBottomNav,
  withSafeTop,
}: ScreenProps) => {
  return (
    <div
      className={cn(
        "w-full mx-auto max-w-lg",
        fullHeight && "min-h-screen-d flex flex-col",
        withSafeTop && "safe-top",
        // BottomNav is 4rem tall + safe-area bottom inset.
        withBottomNav && "pb-[calc(4rem+env(safe-area-inset-bottom))]",
        className
      )}
    >
      {children}
    </div>
  );
};

export default Screen;