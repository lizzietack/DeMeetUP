import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useTypingIndicator(conversationId: string | undefined) {
  const { user } = useAuth();
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  useEffect(() => {
    if (!conversationId || !user) return;
    const channel = supabase
      .channel(`typing-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_presence" },
        (payload: any) => {
          const data = payload.new;
          if (data && data.user_id !== user.id && data.typing_in_conversation === conversationId) {
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