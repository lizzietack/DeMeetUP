import { Home, Search, MessageCircle, User, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const tabs = [
  { icon: Home, label: "Home", path: "/discover" },
  { icon: Search, label: "Discover", path: "/discover" },
  { icon: Sparkles, label: "Featured", path: "/featured" },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
  { icon: User, label: "Profile", path: "/dashboard" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-border/50 safe-area-bottom">
      <nav className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path || 
            (path !== "/" && location.pathname.startsWith(path));
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-0.5 py-1 px-3 relative"
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full gradient-gold"
                />
              )}
              <Icon className={`w-5 h-5 transition-colors ${active ? "text-gold" : "text-muted-foreground"}`} />
              <span className={`text-[10px] font-medium transition-colors ${active ? "text-gold" : "text-muted-foreground"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
