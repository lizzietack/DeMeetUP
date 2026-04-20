import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor config — used when this React app is wrapped in a native shell.
 *
 * Setup (run on your machine after exporting to GitHub):
 *   1. npm install
 *   2. npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
 *   3. npm run build
 *   4. npx cap add ios && npx cap add android
 *   5. npx cap sync
 *   6. npx cap run ios   (or android)
 *
 * The `server.url` block enables hot-reload from the Lovable sandbox while
 * developing on a physical device. Remove it for production builds.
 */
const config: CapacitorConfig = {
  appId: "app.lovable.444cbdae13764b0090d729a3d8454ffd",
  appName: "DeMeetUP",
  webDir: "dist",
  server: {
    url: "https://444cbdae-1376-4b00-90d7-29a3d8454ffd.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#0F0A1A",
  },
  android: {
    backgroundColor: "#0F0A1A",
  },
};

export default config;