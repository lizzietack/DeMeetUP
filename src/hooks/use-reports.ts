import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reported_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useMyReports() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["reports", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("reporter_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return [] as Report[];

      const userIds = [...new Set(data.map((r) => r.reported_user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url }])
      );

      return data.map((r) => ({
        ...r,
        reported_profile: profileMap.get(r.reported_user_id) || { display_name: null, avatar_url: null },
      })) as Report[];
    },
  });
}

export function useSubmitReport() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { reported_user_id: string; reason: "harassment" | "spam" | "inappropriate" | "scam" | "other"; details?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("reports").insert([{
        reporter_id: user.id,
        reported_user_id: input.reported_user_id,
        reason: input.reason,
        details: input.details || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}
