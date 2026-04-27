import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subDays, eachDayOfInterval } from "date-fns";

export const useAdminStats = (enabled: boolean = false) => {
  return useQuery({
    queryKey: ["admin-stats"],
    enabled,
    queryFn: async () => {
      const [profiles, companions, bookings, reports, pendingImages] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("companion_profiles").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("id", { count: "exact", head: true }),
        supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("image_moderation").select("id", { count: "exact", head: true }).eq("status", "pending_review" as any),
      ]);
      return {
        totalUsers: profiles.count || 0,
        totalCompanions: companions.count || 0,
        totalBookings: bookings.count || 0,
        pendingReports: reports.count || 0,
        pendingImages: pendingImages.count || 0,
      };
    },
  });
};

export const useAdminProfiles = (filter: "all" | "flagged" | "companions" | "unverified", enabled: boolean = false) => {
  return useQuery({
    queryKey: ["admin-profiles", filter],
    enabled,
    queryFn: async () => {
      let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
      if (filter === "flagged") query = query.eq("flagged_for_review", true);
      if (filter === "companions") query = query.eq("role", "companion");
      if (filter === "unverified") query = query.eq("photo_verified", false).eq("role", "companion");
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
};

export const useAdminCompanionProfiles = (enabled: boolean = false) => {
  return useQuery({
    queryKey: ["admin-companion-profiles"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companion_profiles")
        .select("*, profiles!companion_profiles_user_id_fkey(display_name, avatar_url, country, photo_verified, selfie_verified, flagged_for_review, trust_score, role)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });
};

export const useAdminReports = (statusFilter: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ["admin-reports", statusFilter],
    enabled,
    queryFn: async () => {
      let query = supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(100);
      if (statusFilter !== "all") query = query.eq("status", statusFilter as any);
      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) return [];
      const userIds = [...new Set([...data.map(r => r.reporter_id), ...data.map(r => r.reported_user_id)])];
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      return data.map(r => ({
        ...r,
        reporter_profile: profileMap.get(r.reporter_id),
        reported_profile: profileMap.get(r.reported_user_id),
      }));
    },
  });
};

export const useAdminUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("profiles").update(updates as any).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-companion-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};

export const useAdminUpdateCompanion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ profileId, updates }: { profileId: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("companion_profiles").update(updates as any).eq("id", profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companion-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};

export const useAdminDeleteCompanion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ profileId }: { profileId: string }) => {
      // companion_images has a delete policy for the profile owner only,
      // so explicitly clean them up first as admin via the cascade-friendly route:
      // we delete images by profile_id; the table doesn't have an admin delete policy,
      // so fall back to relying on the FK or skip — companion_profiles is the source of truth.
      const { error: imgErr } = await supabase
        .from("companion_images")
        .delete()
        .eq("companion_profile_id", profileId);
      if (imgErr) {
        // Non-fatal: images may be orphaned if the policy blocks admin deletes;
        // proceed with the profile delete which is the user's intent.
        console.warn("[useAdminDeleteCompanion] image cleanup warning:", imgErr.message);
      }
      const { error } = await supabase.from("companion_profiles").delete().eq("id", profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companion-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};

export const useAdminGuestProfiles = (enabled: boolean = false) => {
  return useQuery({
    queryKey: ["admin-guest-profiles"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, display_name, avatar_url, country, location, created_at, flagged_for_review, profile_visible, role")
        .eq("role", "guest")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });
};

export const useAdminAllProfiles = (enabled: boolean = false) => {
  return useQuery({
    queryKey: ["admin-all-profiles"],
    enabled,
    queryFn: async () => {
      const [{ data: profiles, error }, { data: roles }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, user_id, display_name, avatar_url, country, location, created_at, flagged_for_review, profile_visible, role, phone, phone_verified")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (error) throw error;
      const adminIds = new Set(
        (roles || []).filter((r: any) => r.role === "admin").map((r: any) => r.user_id)
      );
      return (profiles || []).map((p: any) => ({ ...p, is_admin: adminIds.has(p.user_id) }));
    },
  });
};

export const useAdminDeleteGuest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-guest-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};

export const useAdminDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { data, error } = await supabase.functions.invoke("admin-delete-user", {
        body: { user_id: userId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-guest-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-companion-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};

export const useAdminInvitations = (enabled: boolean = false) => {
  return useQuery({
    queryKey: ["admin-invitations"],
    enabled,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("invitations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });
};

export const useAdminInviteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; platform_role: "guest" | "companion"; grant_admin: boolean }) => {
      const { data, error } = await supabase.functions.invoke("admin-invite-user", {
        body: {
          ...input,
          redirect_to: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invitations"] });
    },
  });
};

export const useAdminRevokeInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await (supabase as any)
        .from("invitations")
        .update({ status: "revoked" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-invitations"] });
    },
  });
};

export const useAdminUpdateReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: string }) => {
      const { error } = await supabase.from("reports").update({ status: status as any }).eq("id", reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};

export const useAdminAnalytics = (days: number = 30, enabled: boolean = false) => {
  return useQuery({
    queryKey: ["admin-analytics", days],
    enabled,
    queryFn: async () => {
      const startDate = subDays(new Date(), days);
      const interval = eachDayOfInterval({ start: startDate, end: new Date() });
      const dateLabels = interval.map(d => format(d, "yyyy-MM-dd"));

      const [profilesRes, bookingsRes, reportsRes] = await Promise.all([
        supabase.from("profiles").select("created_at").gte("created_at", startDate.toISOString()).order("created_at"),
        supabase.from("bookings").select("created_at, status, total").gte("created_at", startDate.toISOString()).order("created_at"),
        supabase.from("reports").select("created_at").gte("created_at", startDate.toISOString()).order("created_at"),
      ]);

      const signupsByDay = new Map<string, number>();
      const bookingsByDay = new Map<string, number>();
      const revenueByDay = new Map<string, number>();
      const reportsByDay = new Map<string, number>();

      dateLabels.forEach(d => {
        signupsByDay.set(d, 0);
        bookingsByDay.set(d, 0);
        revenueByDay.set(d, 0);
        reportsByDay.set(d, 0);
      });

      (profilesRes.data || []).forEach(p => {
        const day = format(new Date(p.created_at), "yyyy-MM-dd");
        signupsByDay.set(day, (signupsByDay.get(day) || 0) + 1);
      });

      (bookingsRes.data || []).forEach(b => {
        const day = format(new Date(b.created_at), "yyyy-MM-dd");
        bookingsByDay.set(day, (bookingsByDay.get(day) || 0) + 1);
        revenueByDay.set(day, (revenueByDay.get(day) || 0) + Number(b.total || 0));
      });

      (reportsRes.data || []).forEach(r => {
        const day = format(new Date(r.created_at), "yyyy-MM-dd");
        reportsByDay.set(day, (reportsByDay.get(day) || 0) + 1);
      });

      return dateLabels.map(date => ({
        date: format(new Date(date), "MMM dd"),
        signups: signupsByDay.get(date) || 0,
        bookings: bookingsByDay.get(date) || 0,
        revenue: revenueByDay.get(date) || 0,
        reports: reportsByDay.get(date) || 0,
      }));
    },
  });
};
