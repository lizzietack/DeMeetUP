import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storage } from "@/platform/storage";
import { isStandalone as nativeStandalone, isIOS } from "@/platform/env";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    const stored = storage.getSync("pwa_banner_dismissed");
    if (!stored) return false;
    // Re-show after 7 days
    return Date.now() - Number(stored) < 7 * 24 * 60 * 60 * 1000;
  });
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Already installed
    if (nativeStandalone) {
      setIsStandalone(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    void storage.set("pwa_banner_dismissed", String(Date.now()));
  };

  // Don't show if already installed, dismissed, or no prompt available
  // On iOS Safari, beforeinstallprompt doesn't fire — show a manual hint
  const showBanner = !isStandalone && !dismissed && (deferredPrompt || (isIOS && !nativeStandalone));

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-20 left-3 right-3 z-50 max-w-lg mx-auto"
      >
        <div className="glass-strong rounded-2xl border border-gold/20 p-4 shadow-2xl shadow-gold/10">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-secondary/80 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center flex-shrink-0 border border-gold/20">
              <Download className="w-6 h-6 text-gold" />
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-semibold text-foreground">Install DeMeetUP</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isIOS
                  ? "Tap Share → Add to Home Screen for the full app experience"
                  : "Add to your home screen for instant access"}
              </p>
            </div>
          </div>

          {deferredPrompt && (
            <Button
              onClick={handleInstall}
              className="w-full mt-3 gradient-gold text-primary-foreground font-semibold rounded-xl h-10 text-sm"
            >
              Install App
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallBanner;
