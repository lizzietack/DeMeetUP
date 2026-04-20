import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Message } from "../types";

export function useMessages(conversationId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  // Tracks message IDs we've already issued a read-receipt update for,
  // so refetches/realtime updates never re-mark the same message twice.
  const markedRef = useRef<Set<string>>(new Set());

  const query = useQuery({
    queryKey: ["messages", conversationId],
    enabled: !!conversationId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;

      return (data || []).map((m: any): Message => ({
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        content: m.content,
        messageType: m.message_type,
        readAt: m.read_at,
        metadata: m.metadata,
        createdAt: m.created_at,
      }));
    },
  });

  // Reset the dedupe set when switching conversations.
  useEffect(() => {
    markedRef.current = new Set();
  }, [conversationId]);

  // Mark unread messages as read — exactly once per message id.
  useEffect(() => {
    if (!user || !query.data || query.data.length === 0) return;
    const toMark = query.data
      .filter((m) => m.senderId !== user.id && !m.readAt && !markedRef.current.has(m.id))
      .map((m) => m.id);
    if (toMark.length === 0) return;
    toMark.forEach((id) => markedRef.current.add(id));
    void supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", toMark);
  }, [query.data, user]);

  useEffect(() => {
    if (!conversationId || !user) return;
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
          queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
        })
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, user, queryClient]);

  return query;
}