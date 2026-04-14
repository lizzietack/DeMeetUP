import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
}

export function useReactions(conversationId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["reactions", conversationId],
    enabled: !!conversationId && !!user,
    queryFn: async () => {
      // Get all message IDs in conversation first
      const { data: messages } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", conversationId!);

      if (!messages?.length) return {};

      const msgIds = messages.map((m) => m.id);

      const { data, error } = await supabase
        .from("message_reactions")
        .select("*")
        .in("message_id", msgIds);

      if (error) throw error;

      // Group by message_id
      const grouped: Record<string, Reaction[]> = {};
      (data || []).forEach((r: any) => {
        const key = r.message_id;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push({
          id: r.id,
          messageId: r.message_id,
          userId: r.user_id,
          emoji: r.emoji,
        });
      });
      return grouped;
    },
  });

  // Realtime for reactions
  useEffect(() => {
    if (!conversationId || !user) return;
    const channel = supabase
      .channel(`reactions-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_reactions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["reactions", conversationId] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, user, queryClient]);

  return query;
}

export function useToggleReaction(conversationId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      if (!user) throw new Error("Not authenticated");

      // Check if reaction exists
      const { data: existing } = await supabase
        .from("message_reactions")
        .select("id")
        .eq("message_id", messageId)
        .eq("user_id", user.id)
        .eq("emoji", emoji)
        .maybeSingle();

      if (existing) {
        await supabase.from("message_reactions").delete().eq("id", existing.id);
      } else {
        const { error } = await supabase.from("message_reactions").insert({
          message_id: messageId,
          user_id: user.id,
          emoji,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reactions", conversationId] });
    },
  });
}
