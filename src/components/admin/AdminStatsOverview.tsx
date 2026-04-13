import { Users, Image, BarChart3, AlertTriangle, BookOpen } from "lucide-react";
import { useAdminStats } from "@/hooks/use-admin";

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) => (
  <div className="glass rounded-xl p-4 flex items-center gap-3">
    <div className={`p-2.5 rounded-lg ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  </div>
);

const AdminStatsOverview = () => {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="glass rounded-xl p-4 h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <StatCard icon={Users} label="Total Users" value={stats?.totalUsers || 0} color="bg-primary/20 text-primary" />
      <StatCard icon={Users} label="Companions" value={stats?.totalCompanions || 0} color="bg-emerald-500/20 text-emerald-400" />
      <StatCard icon={BookOpen} label="Bookings" value={stats?.totalBookings || 0} color="bg-blue-500/20 text-blue-400" />
      <StatCard icon={AlertTriangle} label="Pending Reports" value={stats?.pendingReports || 0} color="bg-amber-500/20 text-amber-400" />
      <StatCard icon={Image} label="Pending Images" value={stats?.pendingImages || 0} color="bg-purple-500/20 text-purple-400" />
    </div>
  );
};

export default AdminStatsOverview;
