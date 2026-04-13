import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";

interface BecauseYouViewed {
  viewedId: string;
  viewedName: string;
  suggestedIds: string[];
}

interface RecommendationResult {
  recommended: string[];
  becauseYouViewed: BecauseYouViewed[];
  reasons: Record<string, string>;
}

export function useRecommendations() {
  const { user } = useAuth();

  return useQuery<RecommendationResult>({
    queryKey: ["recommendations", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // cache 5 min
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("recommendations", {
        body: {},
      });

      if (error) throw error;
      return data as RecommendationResult;
    },
  });
}

export function useTrackInteraction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const trackView = useCallback(
    async (companionProfileId: string) => {
      if (!user) return;
      // Deduplicate: don't track if viewed in last 5 minutes
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: existing } = await supabase
        .from("user_interactions")
        .select("id")
        .eq("user_id", user.id)
        .eq("companion_profile_id", companionProfileId)
        .eq("interaction_type", "view")
        .gte("created_at", fiveMinAgo)
        .limit(1);

      if (existing && existing.length > 0) return;

      await supabase.from("user_interactions").insert({
        user_id: user.id,
        companion_profile_id: companionProfileId,
        interaction_type: "view",
      });
    },
    [user]
  );

  const trackLike = useCallback(
    async (companionProfileId: string) => {
      if (!user) return;
      await supabase.from("user_interactions").insert({
        user_id: user.id,
        companion_profile_id: companionProfileId,
        interaction_type: "like",
      });
      // Invalidate recommendations after new interaction
      queryClient.invalidateQueries({ queryKey: ["recommendations", user.id] });
    },
    [user, queryClient]
  );

  return { trackView, trackLike };
}
