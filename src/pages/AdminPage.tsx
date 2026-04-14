import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, Image, Users, AlertTriangle, Shield, TrendingUp, CalendarCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AdminStatsOverview from "@/components/admin/AdminStatsOverview";
import AdminImageReview from "@/components/admin/AdminImageReview";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminReportsPanel from "@/components/admin/AdminReportsPanel";
import AdminAnalyticsCharts from "@/components/admin/AdminAnalyticsCharts";
import AdminBookingsPanel from "@/components/admin/AdminBookingsPanel";
import AdminNotifications from "@/components/admin/AdminNotifications";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "users", label: "Companions", icon: Users },
  { id: "bookings", label: "Bookings", icon: CalendarCheck },
  { id: "images", label: "Images", icon: Image },
  { id: "reports", label: "Reports", icon: AlertTriangle },
] as const;

type TabId = typeof TABS[number]["id"];

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>("overview");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [user]);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4">
        <Shield className="w-12 h-12 text-destructive" />
        <h1 className="text-lg font-bold text-foreground">Access Denied</h1>
        <p className="text-sm text-muted-foreground text-center">You don't have admin privileges.</p>
        <button onClick={() => navigate("/")} className="text-sm text-primary underline mt-2">Go Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="glass-strong sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="font-display text-lg font-bold text-foreground flex-1">Admin Dashboard</h1>
          <AdminNotifications />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-4 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.id ? "gradient-gold text-primary-foreground" : "glass hover:bg-secondary"
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "overview" && (
          <div className="space-y-6">
            <AdminStatsOverview />
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-3">Recent Images for Review</h2>
                <AdminImageReview />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-3">Recent Reports</h2>
                <AdminReportsPanel />
              </div>
            </div>
          </div>
        )}
        {tab === "analytics" && <AdminAnalyticsCharts />}
        {tab === "users" && <AdminUserManagement />}
        {tab === "bookings" && <AdminBookingsPanel />}
        {tab === "images" && <AdminImageReview />}
        {tab === "reports" && <AdminReportsPanel />}
      </div>
    </div>
  );
};

export default AdminPage;
