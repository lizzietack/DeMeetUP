/**
 * Haptic feedback. Uses Vibration API on web; swap to @capacitor/haptics
 * on native for proper Taptic Engine / vibration feedback.
 */
import { isBrowser, isNative } from "./env";

type Style = "light" | "medium" | "heavy" | "success" | "warning" | "error";

const PATTERNS: Record<Style, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 30, 10],
  warning: [20, 40, 20],
  error: [30, 50, 30, 50, 30],
};

export const haptics = {
  impact(style: Style = "light") {
    if (!isBrowser) return;
    // Future: if (isNative) Haptics.impact({ style })
    try { navigator.vibrate?.(PATTERNS[style]); } catch { /* noop */ }
  },
  selection() {
    this.impact("light");
  },
};