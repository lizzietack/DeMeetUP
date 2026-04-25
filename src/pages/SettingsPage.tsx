import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, BellRing, Lock, LogOut, Moon, Globe, Eye, EyeOff, X, Check, ChevronRight, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { storage } from "@/platform/storage";

const useLocalToggle = (key: string, defaultValue = true) => {
  const [value, setValue] = useState(() => {
    const stored = storage.getSync(key);
    return stored !== null ? stored === "true" : defaultValue;
  });
  const toggle = (v: boolean) => {
    setValue(v);
    void storage.set(key, String(v));
  };
  return [value, toggle] as const;
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const { signOut, user, profile } = useAuth();

  // Theme toggle (dark is default/only for now)
  const [darkMode, setDarkMode] = useLocalToggle("theme_dark", true);

  // Password change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Phone for SMS booking alerts
  const [phone, setPhone] = useState<string>((profile as any)?.phone || "");
  const [savingPhone, setSavingPhone] = useState(false);
  useEffect(() => {
    setPhone((profile as any)?.phone || "");
  }, [profile]);

  const handleSavePhone = async () => {
    if (!user) return;
    const trimmed = phone.trim();
    // Basic validation: digits, +, spaces only; 7-20 chars
    if (trimmed && !/^[+\d\s\-()]{7,20}$/.test(trimmed)) {
      toast.error("Enter a valid phone number");
      return;
    }
    setSavingPhone(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ phone: trimmed || null })
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success(trimmed ? "Phone number saved" : "Phone number removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to save phone");
    } finally {
      setSavingPhone(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/login");
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setChangingPassword(true);
    try {
      // Verify the current password before allowing a change.
      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: user?.email ?? "",
        password: currentPassword,
      });
      if (reAuthError) {
        toast.error("Current password is incorrect");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully");
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="glass-strong sticky top-0 z-10 safe-top">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Settings</h1>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto px-4 pt-6 space-y-5"
      >
        {/* Push Notifications */}
        <PushNotificationSection />

        {/* Notification Preferences Link */}
        <div className="glass rounded-xl overflow-hidden">
          <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Notifications
          </h2>
          <button
            onClick={() => navigate("/notification-preferences")}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors text-left border-t border-border/30"
          >
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
              <Bell className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Notification Preferences</p>
              <p className="text-xs text-muted-foreground">Choose which alerts you receive</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Password & Security */}
        <div className="glass rounded-xl overflow-hidden">
          <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Password & Security
          </h2>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors text-left border-t border-border/30"
          >
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Change Password</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </button>
        </div>

        {/* Appearance */}
        <div className="glass rounded-xl overflow-hidden">
          <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Appearance
          </h2>
          <ToggleRow
            icon={Moon}
            label="Dark Mode"
            description="Always on for this theme"
            checked={darkMode}
            onCheckedChange={(v) => {
              setDarkMode(v);
              toast.info(v ? "Dark mode enabled" : "Dark mode is the default theme");
            }}
          />
          <div className="flex items-center gap-3 px-4 py-3.5 border-t border-border/30">
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
              <Globe className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Language</p>
              <p className="text-xs text-muted-foreground">English</p>
            </div>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Default</span>
          </div>
        </div>

        {/* Log Out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 glass rounded-xl text-destructive text-sm font-semibold hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Log Out
        </button>

        <p className="text-center text-[10px] text-muted-foreground pb-4">Version 1.0.0</p>
      </motion.div>

      {/* Password Change Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm px-4 pb-4"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass rounded-2xl p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-foreground">Change Password</h2>
                <button onClick={() => setShowPasswordModal(false)} className="p-1 rounded-full hover:bg-secondary">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Current Password</Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="bg-secondary border-border/50"
                    autoComplete="current-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">New Password</Label>
                  <div className="relative">
                    <Input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="bg-secondary border-border/50 pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Confirm New Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="bg-secondary border-border/50"
                  />
                  {confirmPassword && newPassword && (
                    <div className="flex items-center gap-1.5 text-xs">
                      {newPassword === confirmPassword ? (
                        <><Check className="w-3 h-3 text-green-400" /><span className="text-green-400">Passwords match</span></>
                      ) : (
                        <><X className="w-3 h-3 text-destructive" /><span className="text-destructive">Passwords don't match</span></>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handlePasswordChange}
                disabled={changingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                className="w-full gradient-gold text-primary-foreground font-semibold rounded-xl h-11"
              >
                {changingPassword ? "Updating…" : "Update Password"}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ToggleRow = ({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  icon: any;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) => (
  <div className="flex items-center gap-3 px-4 py-3.5 border-t border-border/30">
    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
      <Icon className="w-4 h-4 text-muted-foreground" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

const PushNotificationSection = () => {
  const { isSupported, isSubscribed, loading, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) return null;

  return (
    <div className="glass rounded-xl overflow-hidden">
      <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Push Notifications
      </h2>
      <div className="flex items-center gap-3 px-4 py-3.5 border-t border-border/30">
        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <BellRing className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Push Alerts</p>
          <p className="text-xs text-muted-foreground">
            {isSubscribed ? "Get alerts even when the app is closed" : "Enable to receive alerts outside the app"}
          </p>
        </div>
        <Switch
          checked={isSubscribed}
          disabled={loading}
          onCheckedChange={(v) => (v ? subscribe() : unsubscribe())}
        />
      </div>
    </div>
  );
};

export default SettingsPage;
