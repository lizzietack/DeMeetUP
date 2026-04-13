import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, UserX, Flag, Eye, Lock, ChevronRight, BadgeCheck } from "lucide-react";

const sections = [
  {
    title: "Privacy Controls",
    items: [
      { icon: Eye, label: "Profile Visibility", description: "Control who can see your profile", action: true },
      { icon: Lock, label: "Online Status", description: "Hide your online presence", action: true },
    ],
  },
  {
    title: "Safety",
    items: [
      { icon: UserX, label: "Blocked Users", description: "Manage your block list", action: true },
      { icon: Flag, label: "Report Center", description: "View or submit reports", action: true },
    ],
  },
  {
    title: "Verification",
    items: [
      { icon: BadgeCheck, label: "Identity Verification", description: "Verify your identity for trust badges", action: true },
    ],
  },
];

const tips = [
  "Never share personal financial information in chat.",
  "Always meet in public places for first encounters.",
  "Report any suspicious behavior immediately.",
  "Keep your profile information minimal and professional.",
];

const SafetyPrivacyPage = () => {
  const navigate = useNavigate();

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
        {sections.map((section) => (
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
                  <p className="text-xs text-muted-foreground truncate">{description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        ))}

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

export default SafetyPrivacyPage;
