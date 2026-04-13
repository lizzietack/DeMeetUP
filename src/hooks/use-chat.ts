import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Conversation {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  isOnline: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: string;
  readAt: string | null;
  metadata: any;
  createdAt: string;
}

// ── Conversations ──

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

      // Get other user profiles
      const otherIds = (data || []).map((c: any) =>
        c.participant_one === user!.id ? c.participant_two : c.participant_one
      );

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", otherIds);

      const { data: presences } = await supabase
        .from("user_presence")
        .select("user_id, is_online")
        .in("user_id", otherIds);

      // Count unread messages per conversation
      const { data: unreadData } = await supabase
        .from("messages")
        .select("conversation_id, id")
        .in("conversation_id", (data || []).map((c: any) => c.id))
        .neq("sender_id", user!.id)
        .is("read_at", null);

      const unreadMap: Record<string, number> = {};
      (unreadData || []).forEach((m: any) => {
        unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] || 0) + 1;
      });

      const profileMap = Object.fromEntries(
        (profiles || []).map((p: any) => [p.user_id, p])
      );
      const presenceMap = Object.fromEntries(
        (presences || []).map((p: any) => [p.user_id, p])
      );

      return (data || []).map((c: any): Conversation => {
        const otherId =
          c.participant_one === user!.id ? c.participant_two : c.participant_one;
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

  // Realtime subscription for conversation updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("conversations-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return query;
}

// ── Messages ──

export function useMessages(conversationId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

      // Mark unread messages as read
      const unread = (data || []).filter(
        (m: any) => m.sender_id !== user!.id && !m.read_at
      );
      if (unread.length > 0) {
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .in("id", unread.map((m: any) => m.id));
      }

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

  // Realtime for new messages
  useEffect(() => {
    if (!conversationId || !user) return;
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
          queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, user, queryClient]);

  return query;
}

// ── Send Message ──

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
      messageType = "text",
      metadata = {},
    }: {
      conversationId: string;
      content: string;
      messageType?: string;
      metadata?: any;
    }) => {
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

// ── Start Conversation ──

export function useStartConversation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      // Check if conversation already exists
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
        .insert({
          participant_one: user!.id,
          participant_two: otherUserId,
        })
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

// ── Presence ──

export function usePresence() {
  const { user } = useAuth();
  const heartbeatRef = useRef<ReturnType<typeof setInterval>>();

  const setOnline = useCallback(async () => {
    if (!user) return;
    await supabase.from("user_presence").upsert(
      { user_id: user.id, is_online: true, last_seen: new Date().toISOString(), updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  }, [user]);

  const setOffline = useCallback(async () => {
    if (!user) return;
    await supabase.from("user_presence").upsert(
      { user_id: user.id, is_online: false, last_seen: new Date().toISOString(), is_typing: false, typing_in_conversation: null, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  }, [user]);

  const setTyping = useCallback(async (conversationId: string | null) => {
    if (!user) return;
    await supabase.from("user_presence").upsert(
      {
        user_id: user.id,
        is_typing: !!conversationId,
        typing_in_conversation: conversationId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setOnline();
    heartbeatRef.current = setInterval(setOnline, 30000);

    const handleBeforeUnload = () => {
      navigator.sendBeacon?.(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_presence?user_id=eq.${user.id}`,
      );
      setOffline();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(heartbeatRef.current);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      setOffline();
    };
  }, [user, setOnline, setOffline]);

  return { setTyping };
}

// ── Typing indicator ──

export function useTypingIndicator(conversationId: string | undefined) {
  const { user } = useAuth();
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`typing-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_presence",
        },
        (payload: any) => {
          const data = payload.new;
          if (
            data &&
            data.user_id !== user.id &&
            data.typing_in_conversation === conversationId
          ) {
            setIsOtherTyping(data.is_typing);
          } else if (data && data.user_id !== user.id && !data.is_typing) {
            setIsOtherTyping(false);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, user]);

  return isOtherTyping;
}
