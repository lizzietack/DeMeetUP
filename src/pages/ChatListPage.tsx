import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useConversations } from "@/hooks/use-chat";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Search, X, ArrowRight } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SearchResult {
  id: string;
  conversationId: string;
  content: string;
  createdAt: string;
  senderName: string;
}

const ChatListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: conversations, isLoading } = useConversations();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const debouncedQuery = useMemo(() => searchQuery.trim(), [searchQuery]);

  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ["chat-search", debouncedQuery],
    enabled: debouncedQuery.length >= 2 && !!user,
    queryFn: async () => {
      // Search messages in user's conversations
      const { data: convs } = await supabase
        .from("conversations")
        .select("id")
        .or(`participant_one.eq.${user!.id},participant_two.eq.${user!.id}`);

      if (!convs?.length) return [];

      const convIds = convs.map((c) => c.id);

      const { data: messages } = await supabase
        .from("messages")
        .select("id, conversation_id, content, created_at, sender_id")
        .in("conversation_id", convIds)
        .ilike("content", `%${debouncedQuery}%`)
        .neq("message_type", "image")
        .neq("message_type", "voice")
        .order("created_at", { ascending: false })
        .limit(20);

      if (!messages?.length) return [];

      // Get sender profiles
      const senderIds = [...new Set(messages.map((m) => m.sender_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", senderIds);

      const profileMap = Object.fromEntries(
        (profiles || []).map((p) => [p.user_id, p.display_name || "Anonymous"])
      );

      return messages.map((m): SearchResult => ({
        id: m.id,
        conversationId: m.conversation_id,
        content: m.content,
        createdAt: m.created_at,
        senderName: m.sender_id === user!.id ? "You" : (profileMap[m.sender_id] || "Anonymous"),
      }));
    },
  });

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery("");
  }, []);

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + query.length);
    const after = text.slice(idx + query.length);
    // Truncate to show context around match
    const start = Math.max(0, idx - 30);
    const displayBefore = (start > 0 ? "…" : "") + before.slice(start);
    const displayAfter = after.slice(0, 40) + (after.length > 40 ? "…" : "");
    return (
      <>
        {displayBefore}
        <span className="text-gold font-semibold">{match}</span>
        {displayAfter}
      </>
    );
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-30 glass-strong">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">Messages</h1>
              <p className="text-xs text-muted-foreground">
                {conversations?.length || 0} conversation{conversations?.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <Search className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Search bar */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search messages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      className="w-full bg-secondary rounded-full pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                    />
                  </div>
                  <button
                    onClick={closeSearch}
                    className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-2">
        {/* Search results */}
        {isSearchOpen && debouncedQuery.length >= 2 ? (
          <div>
            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No messages found for "{debouncedQuery}"</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-2 px-1">
                  {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                </p>
                {searchResults.map((result, i) => (
                  <motion.button
                    key={result.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => navigate(`/chat/${result.conversationId}`)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-foreground">{result.senderName}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(result.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {highlightMatch(result.content, debouncedQuery)}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </motion.button>
                ))}
              </>
            )}
          </div>
        ) : isSearchOpen && debouncedQuery.length > 0 && debouncedQuery.length < 2 ? (
          <p className="text-xs text-muted-foreground text-center py-8">Type at least 2 characters to search</p>
        ) : (
          <>
            {/* Conversation list */}
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="w-14 h-14 rounded-full bg-secondary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-secondary rounded" />
                    <div className="h-3 w-40 bg-secondary rounded" />
                  </div>
                </div>
              ))
            ) : !conversations?.length ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full glass flex items-center justify-center mb-4">
                  <MessageCircle className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1">No messages yet</h3>
                <p className="text-sm text-muted-foreground max-w-[240px]">
                  Start a conversation from a companion's profile
                </p>
              </div>
            ) : (
              conversations.map((conv, i) => (
                <motion.button
                  key={conv.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={conv.otherUserAvatar || "/placeholder.svg"}
                      alt={conv.otherUserName}
                      className="w-14 h-14 rounded-full object-cover border-2 border-border"
                    />
                    {conv.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-semibold text-foreground text-sm">
                        {conv.otherUserName}
                      </h3>
                      {conv.lastMessageAt && (
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage || "No messages yet"}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="w-5 h-5 rounded-full gradient-gold flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-primary-foreground">{conv.unreadCount}</span>
                    </div>
                  )}
                </motion.button>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatListPage;
