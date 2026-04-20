import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { haptics } from "@/platform/haptics";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Trigger a haptic on press. Default: true. */
  haptic?: boolean;
  /** Visual variant. */
  variant?: "ghost" | "primary" | "destructive";
}

/**
 * Round, 44×44 minimum icon button. Includes haptic feedback,
 * press animation, and proper hover-vs-touch handling so it feels
 * native on mobile.
 */
const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, children, haptic = true, variant = "ghost", onClick, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          if (haptic) haptics.selection();
          onClick?.(e);
        }}
        className={cn(
          "tap-target press inline-flex items-center justify-center rounded-full",
          "transition-colors disabled:opacity-50",
          variant === "ghost" && "hover:bg-secondary text-foreground",
          variant === "primary" && "gradient-gold text-primary-foreground glow-gold",
          variant === "destructive" && "bg-destructive/15 text-destructive hover:bg-destructive/25",
          className
        )}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";

export default IconButton;