import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, CalendarCheck, Megaphone, BellRing, Bell, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";

interface NotifPrefs {
  messages: boolean;
  bookings: boolean;
  promotions: boolean;
  booking_reminders: boolean;
  new_reviews: boolean;
  system_updates: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  messages: true,
  bookings: true,
  promotions: false,
  booking_reminders: true,
  new_reviews: true,
  system_updates: false,
};

const STORAGE_KEY = "notification_preferences";

const loadPrefs = (): NotifPrefs => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
};

const NotificationPreferencesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSupported, isSubscribed, loading: pushLoading, subscribe, unsubscribe } = usePushNotifications();
  const [prefs, setPrefs] = useState<NotifPrefs>(loadPrefs);
  const [saving, setSaving] = useState(false);

  const toggle = (key: keyof NotifPrefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setTimeout(() => {
      setSaving(false);
      toast.success("Notification preferences saved");
    }, 300);
  };

  const sections = [
    {
      title: "Communication",
      items: [
        { key: "messages" as const, icon: MessageSquare, label: "Messages", desc: "New chat messages from companions or guests" },
        { key: "bookings" as const, icon: CalendarCheck, label: "Bookings", desc: "Booking requests, confirmations & cancellations" },
        { key: "booking_reminders" as const, icon: Bell, label: "Booking Reminders", desc: "Reminders before upcoming bookings" },
      ],
    },
    {
      title: "Activity",
      items: [
        { key: "new_reviews" as const, icon: BellRing, label: "Reviews", desc: "When someone leaves a review on your profile" },
      ],
    },
    {
      title: "Marketing",
      items: [
        { key: "promotions" as const, icon: Megaphone, label: "Promotions", desc: "Special offers, discounts & featured spots" },
        { key: "system_updates" as const, icon: Bell, label: "App Updates", desc: "New features & platform announcements" },
      ],
    },
  ];

  return (
    <div className="min-h-screen pb-24">
      <header className="glass-strong sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Notification Preferences</h1>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto px-4 pt-6 space-y-5"
      >
        {/* Push toggle */}
        {isSupported && (
          <div className="glass rounded-xl overflow-hidden">
            <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Push Notifications
            </h2>
            <div className="flex items-center gap-3 px-4 py-3.5 border-t border-border/30">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <BellRing className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Enable Push</p>
                <p className="text-xs text-muted-foreground">
                  {isSubscribed ? "You'll receive alerts even when the app is closed" : "Turn on to get alerts outside the app"}
                </p>
              </div>
              <Switch
                checked={isSubscribed}
                disabled={pushLoading}
                onCheckedChange={(v) => (v ? subscribe() : unsubscribe())}
              />
            </div>
            {!isSubscribed && (
              <p className="px-4 pb-3 text-[11px] text-muted-foreground/70">
                Push must be enabled for the preferences below to trigger browser notifications.
              </p>
            )}
          </div>
        )}

        {/* Preference sections */}
        {sections.map((section) => (
          <div key={section.title} className="glass rounded-xl overflow-hidden">
            <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.title}
            </h2>
            {section.items.map((item) => (
              <div key={item.key} className="flex items-center gap-3 px-4 py-3.5 border-t border-border/30">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch checked={prefs[item.key]} onCheckedChange={() => toggle(item.key)} />
              </div>
            ))}
          </div>
        ))}

        {/* Save */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full gradient-gold text-primary-foreground font-semibold rounded-xl h-11 gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save Preferences"}
        </Button>

        <p className="text-center text-[10px] text-muted-foreground pb-4">
          These preferences control which notifications you receive in-app and via push.
        </p>
      </motion.div>
    </div>
  );
};

export default NotificationPreferencesPage;
