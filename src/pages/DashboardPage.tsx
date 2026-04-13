import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User, Calendar, MessageCircle, Heart, Settings, Shield, LogOut, ChevronRight, Crown } from "lucide-react";
import { bookings } from "@/data/mock";
import { useAuth } from "@/contexts/AuthContext";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { profile, signOut, user } = useAuth();

  const stats = [
    { label: "Active Chats", value: "3", icon: MessageCircle },
    { label: "Bookings", value: bookings.length.toString(), icon: Calendar },
    { label: "Saved", value: "5", icon: Heart },
  ];

  const menuItems = [
    { label: "My Profile", icon: User, path: "/profile/edit" },
    { label: "Booking History", icon: Calendar, path: "/bookings" },
    { label: "Saved Companions", icon: Heart, path: "/saved" },
    { label: "Safety & Privacy", icon: Shield, path: "/safety" },
    { label: "Settings", icon: Settings, path: "/settings" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="glass-strong">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full gradient-purple flex items-center justify-center">
              <User className="w-7 h-7 text-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">
                {profile?.display_name || "User"}
              </h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <Crown className="w-3 h-3 text-gold" />
                <span className="text-[10px] text-gold font-medium uppercase tracking-wider">
                  {profile?.role === "companion" ? "Companion" : "Guest"} Member
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-xl p-3 text-center"
            >
              <stat.icon className="w-5 h-5 text-gold mx-auto mb-1" />
              <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="glass rounded-xl p-4">
          <h2 className="font-display font-semibold text-foreground text-sm mb-3">Recent Bookings</h2>
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">{booking.companionName}</p>
                  <p className="text-xs text-muted-foreground">{booking.service} · {booking.date}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium
                  ${booking.status === "accepted" ? "bg-green-500/10 text-green-400" :
                    booking.status === "pending" ? "bg-gold/10 text-gold" :
                    booking.status === "completed" ? "bg-secondary text-muted-foreground" :
                    "bg-destructive/10 text-destructive"}`}>
                  {booking.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl overflow-hidden">
          {menuItems.map(({ label, icon: Icon, path }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors text-left border-b border-border/50 last:border-0"
            >
              <Icon className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-sm text-foreground">{label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 text-destructive text-sm font-medium"
        >
          <LogOut className="w-4 h-4" /> Log Out
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
