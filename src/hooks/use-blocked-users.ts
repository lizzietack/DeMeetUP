import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
  blocked_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useBlockedUsers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["blocked_users", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_users")
        .select("*")
        .eq("blocker_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch display names for blocked users
      if (!data || data.length === 0) return [] as BlockedUser[];
      const blockedIds = data.map((b) => b.blocked_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", blockedIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.user_id, { display_name: p.display_name, avatar_url: p.avatar_url }])
      );

      return data.map((b) => ({
        ...b,
        blocked_profile: profileMap.get(b.blocked_id) || { display_name: null, avatar_url: null },
      })) as BlockedUser[];
    },
  });
}

export function useUnblockUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (blockId: string) => {
      const { error } = await supabase.from("blocked_users").delete().eq("id", blockId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blocked_users"] }),
  });
}

export function useBlockUser() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (blockedId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("blocked_users")
        .insert({ blocker_id: user.id, blocked_id: blockedId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blocked_users"] }),
  });
}
