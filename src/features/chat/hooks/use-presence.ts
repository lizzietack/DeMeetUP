import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { onPageLeave, onPageEnter } from "@/platform/lifecycle";

/**
 * Presence heartbeat. Uses the Page Lifecycle API instead of `beforeunload`,
 * which is unreliable on iOS Safari and inside native webviews.
 */
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
      {
        user_id: user.id,
        is_online: false,
        last_seen: new Date().toISOString(),
        is_typing: false,
        typing_in_conversation: null,
        updated_at: new Date().toISOString(),
      },
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

    // Mobile-friendly lifecycle handlers (replaces beforeunload + sendBeacon).
    const offLeave = onPageLeave(() => { setOffline(); });
    const offEnter = onPageEnter(() => { setOnline(); });

    return () => {
      clearInterval(heartbeatRef.current);
      offLeave();
      offEnter();
      setOffline();
    };
  }, [user, setOnline, setOffline]);

  return { setTyping };
}