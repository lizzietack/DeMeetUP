import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useConversations } from "@/hooks/use-chat";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle } from "lucide-react";

const ChatListPage = () => {
  const navigate = useNavigate();
  const { data: conversations, isLoading } = useConversations();

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-30 glass-strong">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="font-display text-xl font-bold text-foreground">Messages</h1>
          <p className="text-xs text-muted-foreground">
            {conversations?.length || 0} conversation{conversations?.length !== 1 ? "s" : ""}
          </p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-2">
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
      </div>
    </div>
  );
};

export default ChatListPage;
