import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY = "BNuq5x-F1DxrpZK1KyWp11R0nBWGQCxFU01SMipORokbgef3IHFwPJpSNzaFfTt0COax1C9TpeOwlvM0r0V4DGM";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if already subscribed
  useEffect(() => {
    if (!user || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    });
  }, [user]);

  const subscribe = useCallback(async () => {
    if (!user || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Push notifications are not supported in this browser");
      return false;
    }

    setLoading(true);
    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        toast.error("Notification permission denied");
        return false;
      }

      // Register push-specific service worker
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });

      const subJson = subscription.toJSON();

      // Save to database
      const { error } = await supabase.from("push_subscriptions" as any).upsert(
        {
          user_id: user.id,
          endpoint: subJson.endpoint,
          p256dh: subJson.keys?.p256dh,
          auth_key: subJson.keys?.auth,
        },
        { onConflict: "user_id,endpoint" }
      );

      if (error) throw error;

      setIsSubscribed(true);
      toast.success("Push notifications enabled!");
      return true;
    } catch (err: any) {
      console.error("Push subscription error:", err);
      toast.error("Failed to enable push notifications");
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const unsubscribe = useCallback(async () => {
    if (!user) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        // Remove from DB
        await supabase
          .from("push_subscriptions" as any)
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", sub.endpoint);
      }
      setIsSubscribed(false);
      toast.success("Push notifications disabled");
    } catch (err) {
      console.error("Unsubscribe error:", err);
    }
  }, [user]);

  return {
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
    isSupported: typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window,
  };
};
