import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, Globe, Lock, Palette, LogOut, ChevronRight, User, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/login");
  };

  const settingsSections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Account Preferences", description: "Email, language, region" },
        { icon: Lock, label: "Password & Security", description: "Change password, 2FA" },
      ],
    },
    {
      title: "Notifications",
      items: [
        { icon: Bell, label: "Push Notifications", description: "Messages, bookings, updates" },
      ],
    },
    {
      title: "Appearance",
      items: [
        { icon: Moon, label: "Theme", description: "Dark mode" },
        { icon: Globe, label: "Language", description: "English" },
      ],
    },
  ];

  return (
    <div className="min-h-screen pb-20">
      <header className="glass-strong sticky top-0 z-10">
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
        {settingsSections.map((section) => (
          <div key={section.title} className="glass rounded-xl overflow-hidden">
            <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.title}
            </h2>
            {section.items.map(({ icon: Icon, label, description }) => (
              <button
                key={label}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors text-left border-t border-border/30"
              >
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        ))}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 glass rounded-xl text-destructive text-sm font-semibold hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Log Out
        </button>

        <p className="text-center text-[10px] text-muted-foreground pb-4">Version 1.0.0</p>
      </motion.div>
    </div>
  );
};

export default SettingsPage;
