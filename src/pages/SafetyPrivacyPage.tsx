import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, UserX, Flag, Eye, Lock, ChevronRight, BadgeCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
  const [saving, setSaving] = useState(false);

  // Load current values from profile
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

  const updatePrivacy = async (field: string, value: boolean) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: value })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update setting");
    } else {
      toast.success("Privacy setting updated");
    }
  };

  const handleProfileVisibility = (v: boolean) => {
    setProfileVisible(v);
    updatePrivacy("profile_visible", v);
  };

  const handleOnlineStatus = (v: boolean) => {
    setShowOnline(v);
    updatePrivacy("show_online_status", v);
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
        {/* Privacy Controls — functional toggles */}
        <div className="glass rounded-xl overflow-hidden">
          <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Privacy Controls
          </h2>
          <ToggleRow
            icon={Eye}
            label="Profile Visibility"
            description={profileVisible ? "Your profile is visible to everyone" : "Your profile is hidden from discovery"}
            checked={profileVisible}
            onCheckedChange={handleProfileVisibility}
          />
          <ToggleRow
            icon={Lock}
            label="Online Status"
            description={showOnline ? "Others can see when you're online" : "Your online status is hidden"}
            checked={showOnline}
            onCheckedChange={handleOnlineStatus}
          />
        </div>

        {/* Safety — static for now */}
        <div className="glass rounded-xl overflow-hidden">
          <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Safety
          </h2>
          <StaticRow icon={UserX} label="Blocked Users" description="Manage your block list" />
          <StaticRow icon={Flag} label="Report Center" description="View or submit reports" />
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

const StaticRow = ({ icon: Icon, label, description }: { icon: any; label: string; description: string }) => (
  <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors text-left border-t border-border/30">
    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
      <Icon className="w-4 h-4 text-muted-foreground" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground truncate">{description}</p>
    </div>
    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
  </button>
);

export default SafetyPrivacyPage;
