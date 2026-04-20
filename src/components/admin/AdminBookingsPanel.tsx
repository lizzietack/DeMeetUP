import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Clock, Calendar, Filter } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { format } from "date-fns";

const STATUS_FILTERS = ["all", "pending", "accepted", "rejected", "completed", "cancelled"] as const;

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/80 text-white",
  accepted: "bg-emerald-500/80 text-white",
  rejected: "bg-destructive/80 text-white",
  completed: "bg-primary/80 text-primary-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

const AdminBookingsPanel = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-bookings", statusFilter],
    enabled: isAdmin,
    queryFn: async () => {
      let query = supabase
        .from("bookings")
        .select(`
          *,
          companion_profiles (
            id,
            profiles!companion_profiles_user_id_fkey (display_name, avatar_url, location)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (statusFilter !== "all") query = query.eq("status", statusFilter as any);
      const { data, error } = await query;
      if (error) throw error;

      // Get guest profiles
      const guestIds = [...new Set((data || []).map((b: any) => b.guest_id))];
      const { data: guestProfiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", guestIds);
      const guestMap = new Map((guestProfiles || []).map(p => [p.user_id, p]));

      return (data || []).map((b: any) => ({
        ...b,
        guest_profile: guestMap.get(b.guest_id),
        companion_name: b.companion_profiles?.profiles?.display_name || "Unknown",
        companion_avatar: b.companion_profiles?.profiles?.avatar_url,
      }));
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status: status as any })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  const handleAccept = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: "accepted" });
      toast.success("Booking accepted");
    } catch { toast.error("Failed to update"); }
  };

  const handleCancel = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: "cancelled" });
      toast.success("Booking cancelled");
    } catch { toast.error("Failed to update"); }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : bookings?.length === 0 ? (
        <div className="text-center py-12">
          <Filter className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings?.map((booking: any) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[booking.status] || "bg-muted"}`}>
                      {booking.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {booking.service}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">Guest:</span>{" "}
                      <span className="font-medium text-foreground">{booking.guest_profile?.display_name || "Unknown"}</span>
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div>
                      <span className="text-muted-foreground text-xs">Companion:</span>{" "}
                      <span className="font-medium text-foreground">{booking.companion_name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {booking.booking_date} at {booking.booking_time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {booking.duration_hours}h
                    </span>
                    <span className="font-medium text-foreground">
                      ${Number(booking.total).toFixed(2)}
                    </span>
                  </div>
                  {booking.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">"{booking.notes}"</p>
                  )}
                </div>
                {booking.status === "pending" && (
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleAccept(booking.id)}
                      disabled={updateStatus.isPending}
                      className="flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Accept
                    </button>
                    <button
                      onClick={() => handleCancel(booking.id)}
                      disabled={updateStatus.isPending}
                      className="flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBookingsPanel;
