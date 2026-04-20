/**
 * Key/value storage. Backed by localStorage today; swap to
 * @capacitor/preferences on native for secure, app-scoped storage.
 *
 * API is async to match the eventual native API.
 */
import { isBrowser } from "./env";

const memoryFallback = new Map<string, string>();

function ls(): Storage | null {
  if (!isBrowser) return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const storage = {
  async get(key: string): Promise<string | null> {
    const s = ls();
    if (s) {
      try { return s.getItem(key); } catch { /* fall through */ }
    }
    return memoryFallback.get(key) ?? null;
  },

  async set(key: string, value: string): Promise<void> {
    const s = ls();
    if (s) {
      try { s.setItem(key, value); return; } catch { /* fall through */ }
    }
    memoryFallback.set(key, value);
  },

  async remove(key: string): Promise<void> {
    const s = ls();
    if (s) {
      try { s.removeItem(key); return; } catch { /* fall through */ }
    }
    memoryFallback.delete(key);
  },

  /** Sync read for boot-time hydration only. Avoid in new code. */
  getSync(key: string): string | null {
    const s = ls();
    if (s) {
      try { return s.getItem(key); } catch { /* fall through */ }
    }
    return memoryFallback.get(key) ?? null;
  },
};

/** JSON helpers. */
export async function getJSON<T>(key: string, fallback: T): Promise<T> {
  const raw = await storage.get(key);
  if (raw == null) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export async function setJSON(key: string, value: unknown): Promise<void> {
  await storage.set(key, JSON.stringify(value));
}