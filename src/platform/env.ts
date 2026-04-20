/** Runtime environment detection. Single source of truth. */

export const isBrowser = typeof window !== "undefined";

export const isNative = (() => {
  if (!isBrowser) return false;
  // Capacitor injects window.Capacitor at runtime.
  return Boolean((window as any).Capacitor?.isNativePlatform?.());
})();

export const platform: "ios" | "android" | "web" = (() => {
  if (!isBrowser) return "web";
  const cap = (window as any).Capacitor;
  if (cap?.getPlatform) {
    const p = cap.getPlatform();
    if (p === "ios" || p === "android") return p;
  }
  const ua = navigator.userAgent || "";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "web";
})();

export const isIOS = platform === "ios";
export const isAndroid = platform === "android";

export const isStandalone = (() => {
  if (!isBrowser) return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true ||
    isNative
  );
})();

export const isPreviewIframe = (() => {
  if (!isBrowser) return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();