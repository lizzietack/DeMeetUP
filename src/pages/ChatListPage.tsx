import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { chatThreads } from "@/data/mock";

const ChatListPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-30 glass-strong">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1 className="font-display text-xl font-bold text-foreground">Messages</h1>
          <p className="text-xs text-muted-foreground">{chatThreads.length} conversations</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-2">
        {chatThreads.map((thread, i) => (
          <motion.button
            key={thread.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => navigate(`/chat/${thread.companionId}`)}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
          >
            <div className="relative flex-shrink-0">
              <img src={thread.companionImage} alt={thread.companionName}
                   className="w-14 h-14 rounded-full object-cover border-2 border-border" />
              {thread.online && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-background" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-foreground text-sm">{thread.companionName}</h3>
                <span className="text-[10px] text-muted-foreground">{thread.lastMessageTime}</span>
              </div>
              <p className="text-sm text-muted-foreground truncate">{thread.lastMessage}</p>
            </div>
            {thread.unread > 0 && (
              <div className="w-5 h-5 rounded-full gradient-gold flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-primary-foreground">{thread.unread}</span>
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ChatListPage;
