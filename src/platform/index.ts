/**
 * Platform abstraction layer.
 *
 * Every API in this folder has a Web implementation today and is shaped
 * to be swapped out for Capacitor / React Native equivalents later
 * (e.g. @capacitor/preferences, @capacitor/camera, @capacitor/share,
 * @capacitor/haptics, @capacitor/push-notifications, @capacitor/clipboard).
 *
 * Application code MUST import from "@/platform/*" — never call
 * navigator.* / window.* / localStorage directly outside this folder.
 */
export * from "./env";
export * from "./storage";
export * from "./haptics";
export * from "./share";
export * from "./clipboard";
export * from "./media";
export * from "./lifecycle";