import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useSavedCompanions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["saved_companions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_companions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useSavedCompanionIds() {
  const { data } = useSavedCompanions();
  return new Set((data || []).map((s) => s.companion_profile_id));
}

export function useToggleSaveCompanion() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ companionProfileId, isSaved }: { companionProfileId: string; isSaved: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      if (isSaved) {
        const { error } = await supabase
          .from("saved_companions")
          .delete()
          .eq("user_id", user.id)
          .eq("companion_profile_id", companionProfileId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_companions")
          .insert([{ user_id: user.id, companion_profile_id: companionProfileId }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved_companions"] });
    },
  });
}
