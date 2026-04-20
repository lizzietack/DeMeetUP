/**
 * Page lifecycle hooks. Page Lifecycle API is more reliable on mobile
 * than `beforeunload` (which doesn't fire reliably on iOS Safari).
 * Maps cleanly to Capacitor App plugin events later (appStateChange).
 */
import { isBrowser } from "./env";

type Callback = () => void;

/**
 * Fires when the page is being hidden / put in background / closed.
 * Use for "set offline", flush queued updates, etc.
 */
export function onPageLeave(cb: Callback): () => void {
  if (!isBrowser) return () => {};
  const handleVisibility = () => {
    if (document.visibilityState === "hidden") cb();
  };
  // pagehide is the most reliable cross-browser "I'm leaving" signal.
  const handlePageHide = () => cb();
  document.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("pagehide", handlePageHide);
  return () => {
    document.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("pagehide", handlePageHide);
  };
}

/** Fires when the page becomes visible again (foreground). */
export function onPageEnter(cb: Callback): () => void {
  if (!isBrowser) return () => {};
  const handler = () => {
    if (document.visibilityState === "visible") cb();
  };
  document.addEventListener("visibilitychange", handler);
  return () => document.removeEventListener("visibilitychange", handler);
}