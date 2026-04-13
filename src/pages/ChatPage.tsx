import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Send, Mic, Image, MoreVertical, Check, CheckCheck,
  DollarSign, Sparkles, ShieldBan,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  useMessages, useSendMessage, usePresence, useTypingIndicator,
} from "@/hooks/use-chat";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import TipModal from "@/components/TipModal";
import { useBlockUser, useBlockedUsers } from "@/hooks/use-blocked-users";

const ChatPage = () => {
  const { id: conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [showTipModal, setShowTipModal] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const { data: messages = [], isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const { setTyping } = usePresence();
  const isOtherTyping = useTypingIndicator(conversationId);
  const blockUser = useBlockUser();
  const { data: blockedUsers = [] } = useBlockedUsers();


  // Get conversation info (other user)
  const { data: convInfo } = useQuery({
    queryKey: ["conversation-info", conversationId],
    enabled: !!conversationId && !!user,
    queryFn: async () => {
      const { data: conv } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId!)
        .single();

      if (!conv) return null;

      const otherId = conv.participant_one === user!.id ? conv.participant_two : conv.participant_one;

      const [{ data: profile }, { data: presence }] = await Promise.all([
        supabase.from("profiles").select("display_name, avatar_url").eq("user_id", otherId).single(),
        supabase.from("user_presence").select("is_online, last_seen").eq("user_id", otherId).maybeSingle(),
      ]);

      return {
        otherId,
        name: profile?.display_name || "Anonymous",
        avatar: profile?.avatar_url || "/placeholder.svg",
        isOnline: presence?.is_online || false,
        lastSeen: presence?.last_seen,
      };
    },
  });

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOtherTyping]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!conversationId) return;
    setTyping(conversationId);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setTyping(null), 2000);
  }, [conversationId, setTyping]);

  const handleSend = () => {
    if (!message.trim() || !conversationId) return;
    sendMessage.mutate({ conversationId, content: message.trim() });
    setMessage("");
    setTyping(null);
    clearTimeout(typingTimeoutRef.current);
  };

  const handleSendTip = (amount: number) => {
    if (!conversationId) return;
    sendMessage.mutate({
      conversationId,
      content: `💰 Sent a $${amount} tip!`,
      messageType: "tip",
      metadata: { amount },
    });
  };

  const StatusIcon = ({ msg }: { msg: { senderId: string; readAt: string | null } }) => {
    if (msg.senderId !== user?.id) return null;
    if (msg.readAt) return <CheckCheck className="w-3 h-3 text-gold" />;
    return <Check className="w-3 h-3 text-muted-foreground" />;
  };

  if (!conversationId) return null;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="glass-strong border-b border-border/50 flex-shrink-0">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button onClick={() => navigate("/chat")} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <img src={convInfo?.avatar || "/placeholder.svg"} alt="" className="w-10 h-10 rounded-full object-cover" />
              {convInfo?.isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-background" />}
            </div>
            <div>
              <h2 className="font-display font-semibold text-foreground text-sm">{convInfo?.name || "..."}</h2>
              <p className="text-[10px] text-muted-foreground">
                {convInfo?.isOnline
                  ? "Online"
                  : convInfo?.lastSeen
                    ? `Last seen ${formatDistanceToNow(new Date(convInfo.lastSeen), { addSuffix: true })}`
                    : "Offline"}
              </p>
            </div>
          </div>
          <button onClick={() => setShowTipModal(true)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors" title="Send Tip">
            <DollarSign className="w-5 h-5 text-gold" />
          </button>
          <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
            <MoreVertical className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-lg mx-auto w-full">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === user?.id;
            const isTip = msg.messageType === "tip";

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.5) }}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                  isTip
                    ? "gradient-gold text-primary-foreground rounded-br-sm glow-gold"
                    : isMe
                      ? "gradient-gold text-primary-foreground rounded-br-sm"
                      : "glass rounded-bl-sm"
                }`}>
                  {isTip && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">Tip</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                    <span className={`text-[10px] ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </span>
                    <StatusIcon msg={msg} />
                  </div>
                </div>
              </motion.div>
            );
          })
        )}

        {/* Typing indicator */}
        {isOtherTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="glass rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-muted-foreground"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="glass-strong border-t border-border/50 px-4 py-3 flex-shrink-0">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
            <Image className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="w-full bg-secondary rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground
                         focus:outline-none focus:ring-1 focus:ring-gold/50"
            />
          </div>
          {message.trim() ? (
            <button onClick={handleSend} className="w-9 h-9 rounded-full gradient-gold flex items-center justify-center glow-gold">
              <Send className="w-4 h-4 text-primary-foreground" />
            </button>
          ) : (
            <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
              <Mic className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Tip Modal */}
      <TipModal
        isOpen={showTipModal}
        onClose={() => setShowTipModal(false)}
        onSendTip={handleSendTip}
        recipientName={convInfo?.name || ""}
      />
    </div>
  );
};

export default ChatPage;
