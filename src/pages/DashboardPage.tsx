import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User, Calendar, MessageCircle, Heart, Settings, Shield, LogOut, ChevronRight, Crown, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useMyBookings, useUpdateBookingStatus } from "@/hooks/use-bookings";
import { useConversations } from "@/hooks/use-chat";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  pending: { icon: Clock, color: "text-gold", bg: "bg-gold/10" },
  accepted: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
  rejected: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  completed: { icon: CheckCircle, color: "text-muted-foreground", bg: "bg-secondary" },
  cancelled: { icon: AlertCircle, color: "text-muted-foreground", bg: "bg-secondary" },
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { profile, signOut, user } = useAuth();
  const { data: bookings = [], isLoading: bookingsLoading } = useMyBookings();
  const { data: conversations = [] } = useConversations();
  const updateStatus = useUpdateBookingStatus();

  const isCompanion = profile?.role === "companion";

  const stats = [
    { label: "Active Chats", value: conversations.length.toString(), icon: MessageCircle },
    { label: "Bookings", value: bookings.length.toString(), icon: Calendar },
    { label: "Pending", value: bookings.filter((b) => b.status === "pending").length.toString(), icon: Clock },
  ];

  const menuItems = [
    { label: "My Profile", icon: User, path: "/profile" },
    { label: "Saved Companions", icon: Heart, path: "/saved-companions" },
    { label: "Safety & Privacy", icon: Shield, path: "/safety-privacy" },
    { label: "Settings", icon: Settings, path: "/settings" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleStatusUpdate = async (bookingId: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ bookingId, status });
      toast.success(`Booking ${status}`);
    } catch {
      toast.error("Failed to update booking");
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const otherBookings = bookings.filter((b) => b.status !== "pending");

  return (
    <div className="min-h-screen pb-20">
      <header className="glass-strong safe-top">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full gradient-purple flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
              ) : (
                <User className="w-7 h-7 text-foreground" />
              )}
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">
                {profile?.display_name || "User"}
              </h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <Crown className="w-3 h-3 text-gold" />
                <span className="text-[10px] text-gold font-medium uppercase tracking-wider">
                  {isCompanion ? "Companion" : "Guest"} Member
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Stats */}
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

        {/* Pending bookings (action required) */}
        {pendingBookings.length > 0 && isCompanion && (
          <div className="glass rounded-xl p-4">
            <h2 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-gold" /> Action Required
            </h2>
            <div className="space-y-3">
              {pendingBookings.map((booking) => (
                <div key={booking.id} className="glass rounded-xl p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">{booking.companionName}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.service} · {new Date(booking.bookingDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} at {booking.bookingTime}
                      </p>
                    </div>
                    <span className="font-display font-bold text-gold">${booking.total}</span>
                  </div>
                  {booking.notes && (
                    <p className="text-xs text-muted-foreground italic">"{booking.notes}"</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusUpdate(booking.id, "accepted")}
                      disabled={updateStatus.isPending}
                      className="flex-1 py-2 rounded-lg gradient-gold text-primary-foreground text-xs font-semibold"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(booking.id, "rejected")}
                      disabled={updateStatus.isPending}
                      className="flex-1 py-2 rounded-lg bg-secondary text-muted-foreground text-xs font-semibold hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All bookings */}
        <div className="glass rounded-xl p-4">
          <h2 className="font-display font-semibold text-foreground text-sm mb-3">
            {isCompanion ? "Booking Requests" : "My Bookings"}
          </h2>
          {bookingsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-secondary" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-secondary rounded w-1/2" />
                    <div className="h-2 bg-secondary rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No bookings yet</p>
          ) : (
            <div className="space-y-3">
              {(isCompanion ? otherBookings : bookings).map((booking) => {
                const config = statusConfig[booking.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                return (
                  <div key={booking.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {booking.companionImage && (
                        <img src={booking.companionImage} className="w-10 h-10 rounded-xl object-cover" alt="" />
                      )}
                      <div>
                        <p className="font-medium text-foreground text-sm">{booking.companionName}</p>
                        <p className="text-xs text-muted-foreground">
                          {booking.service} · {new Date(booking.bookingDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-semibold text-foreground">${booking.total}</span>
                      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${config.bg} ${config.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {booking.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Menu */}
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
