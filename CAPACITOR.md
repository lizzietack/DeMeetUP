# DeMeetUP — Native (Capacitor) setup

This codebase is **mobile-native ready**. To ship it to the App Store / Play Store:

## 1. One-time setup

```bash
# 1. Export this Lovable project to GitHub, then:
git pull
npm install

# 2. Add Capacitor + native shells
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
npx cap init   # Already configured via capacitor.config.ts — accept defaults

# 3. Build the web bundle and add platforms
npm run build
npx cap add ios
npx cap add android
npx cap sync
```

## 2. Daily workflow

After every `git pull` from Lovable:

```bash
npm install
npm run build
npx cap sync
npx cap run ios     # or: npx cap run android
```

## 3. Native plugins (when you want them)

The codebase already routes everything through `src/platform/*`, so swapping in
native plugins is a one-file change per concern.

| Concern        | Web file (today)           | Add this plugin                      |
| -------------- | -------------------------- | ------------------------------------ |
| Storage        | `src/platform/storage.ts`  | `@capacitor/preferences`             |
| Camera/gallery | `src/platform/media.ts`    | `@capacitor/camera`                  |
| Haptics        | `src/platform/haptics.ts`  | `@capacitor/haptics`                 |
| Share          | `src/platform/share.ts`    | `@capacitor/share`                   |
| Clipboard      | `src/platform/clipboard.ts`| `@capacitor/clipboard`               |
| Push           | `src/hooks/use-push-notifications.ts` | `@capacitor/push-notifications` |
| Lifecycle      | `src/platform/lifecycle.ts`| `@capacitor/app`                     |

## 4. Architecture rules (so the code stays portable)

- ✅ Always import platform APIs from `@/platform/*`. Never call
  `localStorage`, `navigator.share`, `navigator.clipboard`, etc. directly
  outside the `src/platform/` folder.
- ✅ Screens live in `src/pages/*` (acts as RN-style screens).
- ✅ Feature logic lives in `src/features/<feature>/{hooks,components}`.
- ✅ Use `h-screen-d` instead of `h-screen` for full-height layouts so the
  mobile URL bar doesn't break things.
- ✅ Use `safe-bottom` / `safe-top` utilities on fixed bars.
- ❌ Never use `beforeunload` / `sendBeacon` for cleanup — use
  `onPageLeave()` from `@/platform/lifecycle`.
- ❌ Never use hover-only affordances (`group-hover:` for primary actions).

Read more: <https://lovable.dev/blog/capacitor-mobile-app-development>