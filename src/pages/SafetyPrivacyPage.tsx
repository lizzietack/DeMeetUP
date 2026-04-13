import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, UserX, Flag, Eye, Lock, BadgeCheck, X, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useBlockedUsers, useUnblockUser } from "@/hooks/use-blocked-users";
import { toast } from "sonner";

const tips = [
  "Never share personal financial information in chat.",
  "Always meet in public places for first encounters.",
  "Report any suspicious behavior immediately.",
  "Keep your profile information minimal and professional.",
];

const SafetyPrivacyPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [profileVisible, setProfileVisible] = useState(true);
  const [showOnline, setShowOnline] = useState(true);
  const [showBlockedPanel, setShowBlockedPanel] = useState(false);

  const { data: blockedUsers = [], isLoading: blockedLoading } = useBlockedUsers();
  const unblock = useUnblockUser();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("profile_visible, show_online_status")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfileVisible(data.profile_visible ?? true);
          setShowOnline(data.show_online_status ?? true);
        }
      });
  }, [user]);

  const updatePrivacy = async (field: "profile_visible" | "show_online_status", value: boolean) => {
    if (!user) return;
    const update = field === "profile_visible" ? { profile_visible: value } : { show_online_status: value };
    const { error } = await supabase.from("profiles").update(update).eq("user_id", user.id);
    if (error) toast.error("Failed to update setting");
    else toast.success("Privacy setting updated");
  };

  const handleUnblock = async (blockId: string, name: string) => {
    try {
      await unblock.mutateAsync(blockId);
      toast.success(`${name} has been unblocked`);
    } catch {
      toast.error("Failed to unblock user");
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="glass-strong sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display text-lg font-bold text-foreground">Safety & Privacy</h1>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto px-4 pt-6 space-y-5"
      >
        {/* Privacy Controls */}
        <div className="glass rounded-xl overflow-hidden">
          <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Privacy Controls
          </h2>
          <ToggleRow
            icon={Eye}
            label="Profile Visibility"
            description={profileVisible ? "Your profile is visible to everyone" : "Your profile is hidden from discovery"}
            checked={profileVisible}
            onCheckedChange={(v) => { setProfileVisible(v); updatePrivacy("profile_visible", v); }}
          />
          <ToggleRow
            icon={Lock}
            label="Online Status"
            description={showOnline ? "Others can see when you're online" : "Your online status is hidden"}
            checked={showOnline}
            onCheckedChange={(v) => { setShowOnline(v); updatePrivacy("show_online_status", v); }}
          />
        </div>

        {/* Safety */}
        <div className="glass rounded-xl overflow-hidden">
          <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Safety
          </h2>
          <button
            onClick={() => setShowBlockedPanel(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors text-left border-t border-border/30"
          >
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
              <UserX className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Blocked Users</p>
              <p className="text-xs text-muted-foreground">
                {blockedUsers.length === 0 ? "No blocked users" : `${blockedUsers.length} blocked`}
              </p>
            </div>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              {blockedUsers.length}
            </span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors text-left border-t border-border/30">
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
              <Flag className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Report Center</p>
              <p className="text-xs text-muted-foreground">View or submit reports</p>
            </div>
          </button>
        </div>

        {/* Verification */}
        <div className="glass rounded-xl overflow-hidden">
          <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Verification
          </h2>
          <div className="flex items-center gap-3 px-4 py-3.5 border-t border-border/30">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${profile?.role === "companion" ? "bg-primary/10" : "bg-secondary"}`}>
              <BadgeCheck className={`w-4 h-4 ${profile?.role === "companion" ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Identity Verification</p>
              <p className="text-xs text-muted-foreground">
                {profile?.role === "companion" ? "Verified companion account" : "Standard account — no verification needed"}
              </p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${profile?.role === "companion" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
              {profile?.role === "companion" ? "Verified" : "N/A"}
            </span>
          </div>
        </div>

        {/* Safety Tips */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Safety Tips</h2>
          </div>
          <ul className="space-y-2.5">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Blocked Users Panel */}
      <AnimatePresence>
        {showBlockedPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm px-4 pb-4"
            onClick={() => setShowBlockedPanel(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass rounded-2xl p-5 max-h-[70vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-bold text-foreground">Blocked Users</h2>
                <button onClick={() => setShowBlockedPanel(false)} className="p-1 rounded-full hover:bg-secondary">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
                {blockedLoading ? (
                  <div className="space-y-3 py-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-secondary" />
                        <div className="flex-1 space-y-1">
                          <div className="h-3 bg-secondary rounded w-1/2" />
                          <div className="h-2 bg-secondary rounded w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : blockedUsers.length === 0 ? (
                  <div className="flex flex-col items-center py-10 text-center">
                    <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-3">
                      <UserX className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">No blocked users</p>
                    <p className="text-xs text-muted-foreground max-w-[200px]">
                      You haven't blocked anyone. You can block users from their profile or chat.
                    </p>
                  </div>
                ) : (
                  blockedUsers.map((block) => {
                    const name = block.blocked_profile?.display_name || "Unknown";
                    const initials = name.slice(0, 2).toUpperCase();
                    return (
                      <div key={block.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                        <Avatar className="w-10 h-10">
                          {block.blocked_profile?.avatar_url ? (
                            <AvatarImage src={block.blocked_profile.avatar_url} alt={name} />
                          ) : null}
                          <AvatarFallback className="bg-secondary text-foreground text-xs font-display">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{name}</p>
                          <p className="text-xs text-muted-foreground">
                            Blocked {new Date(block.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnblock(block.id, name)}
                          disabled={unblock.isPending}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Unblock
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ToggleRow = ({
  icon: Icon, label, description, checked, onCheckedChange,
}: {
  icon: any; label: string; description: string; checked: boolean; onCheckedChange: (v: boolean) => void;
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

export default SafetyPrivacyPage;
