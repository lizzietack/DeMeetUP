import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SendMessageInput {
  conversationId: string;
  content: string;
  messageType?: string;
  metadata?: any;
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ conversationId, content, messageType = "text", metadata = {} }: SendMessageInput) => {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user!.id,
          content,
          message_type: messageType,
          metadata,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
    },
  });
}

export function useStartConversation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .or(
          `and(participant_one.eq.${user!.id},participant_two.eq.${otherUserId}),and(participant_one.eq.${otherUserId},participant_two.eq.${user!.id})`
        )
        .maybeSingle();
      if (existing) return existing.id;

      const { data, error } = await supabase
        .from("conversations")
        .insert({ participant_one: user!.id, participant_two: otherUserId })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
    },
  });
}