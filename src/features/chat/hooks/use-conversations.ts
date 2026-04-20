import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Conversation } from "../types";

export function useConversations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`participant_one.eq.${user!.id},participant_two.eq.${user!.id}`)
        .order("last_message_at", { ascending: false });
      if (error) throw error;

      const otherIds = (data || []).map((c: any) =>
        c.participant_one === user!.id ? c.participant_two : c.participant_one
      );

      const [{ data: profiles }, { data: presences }, { data: unreadData }] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", otherIds),
        supabase.from("user_presence").select("user_id, is_online").in("user_id", otherIds),
        supabase.from("messages").select("conversation_id, id")
          .in("conversation_id", (data || []).map((c: any) => c.id))
          .neq("sender_id", user!.id)
          .is("read_at", null),
      ]);

      const unreadMap: Record<string, number> = {};
      (unreadData || []).forEach((m: any) => {
        unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] || 0) + 1;
      });
      const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p]));
      const presenceMap = Object.fromEntries((presences || []).map((p: any) => [p.user_id, p]));

      return (data || []).map((c: any): Conversation => {
        const otherId = c.participant_one === user!.id ? c.participant_two : c.participant_one;
        const profile = profileMap[otherId];
        const presence = presenceMap[otherId];
        return {
          id: c.id,
          otherUserId: otherId,
          otherUserName: profile?.display_name || "Anonymous",
          otherUserAvatar: profile?.avatar_url || null,
          lastMessage: c.last_message_text,
          lastMessageAt: c.last_message_at,
          unreadCount: unreadMap[c.id] || 0,
          isOnline: presence?.is_online || false,
        };
      });
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("conversations-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return query;
}