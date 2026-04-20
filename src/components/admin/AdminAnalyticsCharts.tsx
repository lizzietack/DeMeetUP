import { useState } from "react";
import { useAdminAnalytics } from "@/hooks/use-admin";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const AdminAnalyticsCharts = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  const [days, setDays] = useState(30);
  const { data: analytics, isLoading } = useAdminAnalytics(days, isAdmin);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-2">
        {[7, 14, 30].map(d => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              days === d ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Signups & Bookings Area Chart */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">User Signups & Bookings</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={analytics} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(var(--foreground))",
              }}
            />
            <Area type="monotone" dataKey="signups" stroke="hsl(var(--primary))" fill="url(#signupGrad)" strokeWidth={2} name="Signups" />
            <Area type="monotone" dataKey="bookings" stroke="#10b981" fill="url(#bookingGrad)" strokeWidth={2} name="Bookings" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Bar Chart */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">Revenue</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={analytics} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(var(--foreground))",
              }}
            />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Reports Area Chart */}
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">Reports Filed</h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={analytics} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="reportGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
                color: "hsl(var(--foreground))",
              }}
            />
            <Area type="monotone" dataKey="reports" stroke="#f59e0b" fill="url(#reportGrad)" strokeWidth={2} name="Reports" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdminAnalyticsCharts;
