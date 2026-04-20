/**
 * Share / Clipboard primitives. Uses Web Share + Clipboard APIs today;
 * swap to @capacitor/share + @capacitor/clipboard on native.
 */
import { isBrowser } from "./env";

export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
}

export async function share(data: ShareData): Promise<{ shared: boolean }> {
  if (!isBrowser) return { shared: false };
  const nav: any = navigator;
  if (nav.share) {
    try {
      await nav.share(data);
      return { shared: true };
    } catch (err: any) {
      if (err?.name === "AbortError") return { shared: false };
      // fall back to clipboard
    }
  }
  return { shared: false };
}

export function canShare(): boolean {
  return isBrowser && typeof (navigator as any).share === "function";
}