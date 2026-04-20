import { ReactNode, useCallback } from "react";
import { toast } from "sonner";
import { pickMedia, type MediaSource } from "@/platform/media";
import { haptics } from "@/platform/haptics";

interface MediaPickerButtonProps {
  onPicked: (file: File) => void;
  source?: MediaSource;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}

/**
 * Touch-friendly file/camera picker. Wraps `pickMedia` from the platform
 * layer so screens never deal with hidden <input type="file"> hacks.
 * On native, this swaps to the Capacitor Camera plugin transparently.
 */
const MediaPickerButton = ({
  onPicked,
  source = "any",
  accept = "image/*",
  maxSizeMB = 5,
  disabled,
  className,
  children,
  ariaLabel,
}: MediaPickerButtonProps) => {
  const handleClick = useCallback(async () => {
    haptics.selection();
    try {
      const picked = await pickMedia({ source, accept, maxSizeMB });
      if (picked.length === 0) return;
      onPicked(picked[0].file);
    } catch (err: any) {
      toast.error(err?.message || "Couldn't pick media");
    }
  }, [onPicked, source, accept, maxSizeMB]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </button>
  );
};

export default MediaPickerButton;