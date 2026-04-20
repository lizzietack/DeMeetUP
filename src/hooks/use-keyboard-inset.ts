import { useEffect, useState } from "react";
import { isBrowser } from "@/platform/env";

/**
 * Tracks the bottom inset created by the on-screen keyboard so we
 * can lift sticky inputs above it on mobile. Uses visualViewport,
 * which is the right API on iOS Safari + Android Chrome + WKWebView.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (!isBrowser) return;
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // Distance from the bottom of the layout viewport to the bottom
      // of the visual viewport ≈ keyboard height.
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      setInset(offset > 0 ? offset : 0);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return inset;
}