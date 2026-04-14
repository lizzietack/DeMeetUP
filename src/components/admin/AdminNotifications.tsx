import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, X, AlertTriangle, Image } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: "report" | "image";
  message: string;
  timestamp: Date;
}

const AdminNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("admin-notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "reports",
      }, (payload) => {
        const n: Notification = {
          id: payload.new.id,
          type: "report",
          message: `New report: ${payload.new.reason}`,
          timestamp: new Date(),
        };
        setNotifications(prev => [n, ...prev].slice(0, 20));
        toast.info("New report submitted", { icon: <AlertTriangle className="w-4 h-4" /> });
      })
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "image_moderation",
      }, (payload) => {
        const n: Notification = {
          id: payload.new.id,
          type: "image",
          message: `New image pending review (${payload.new.image_type})`,
          timestamp: new Date(),
        };
        setNotifications(prev => [n, ...prev].slice(0, 20));
        toast.info("New image pending review", { icon: <Image className="w-4 h-4" /> });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 rounded-full hover:bg-secondary transition-colors"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {notifications.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
            {notifications.length > 9 ? "9+" : notifications.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto glass-strong rounded-xl shadow-xl z-50 border border-border"
          >
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={() => setNotifications([])}
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 flex items-start gap-2.5 hover:bg-secondary/50 transition-colors">
                    {n.type === "report" ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <Image className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {n.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <button onClick={() => clearNotification(n.id)} className="shrink-0 p-0.5 hover:bg-secondary rounded">
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminNotifications;
