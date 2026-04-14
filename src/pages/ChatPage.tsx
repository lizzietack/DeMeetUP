import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Send, Image, MoreVertical, Check, CheckCheck,
  DollarSign, Sparkles, ShieldBan, Flag, Mic,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback, ChangeEvent } from "react";
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
import ReportUserModal from "@/components/ReportUserModal";
import ImageLightbox from "@/components/chat/ImageLightbox";
import VoiceRecorder from "@/components/chat/VoiceRecorder";
import AudioMessage from "@/components/chat/AudioMessage";

const ChatPage = () => {
  const { id: conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [showTipModal, setShowTipModal] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [isRecordingMode, setIsRecordingMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const isOtherBlocked = convInfo?.otherId ? blockedUsers.some((b) => b.blocked_id === convInfo.otherId) : false;

  const handleBlockFromChat = async () => {
    if (!convInfo?.otherId) return;
    try {
      await blockUser.mutateAsync(convInfo.otherId);
      toast.success(`${convInfo.name} has been blocked`);
      setShowChatMenu(false);
    } catch {
      toast.error("Failed to block user");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOtherTyping]);

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

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("chat-images")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("chat-images")
        .getPublicUrl(path);

      sendMessage.mutate({
        conversationId,
        content: urlData.publicUrl,
        messageType: "image",
        metadata: { fileName: file.name, fileSize: file.size },
      });
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendVoiceNote = async (blob: Blob, durationSec: number) => {
    if (!conversationId || !user) return;
    setIsUploading(true);
    try {
      const path = `${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("voice-notes")
        .upload(path, blob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("voice-notes")
        .getPublicUrl(path);

      sendMessage.mutate({
        conversationId,
        content: urlData.publicUrl,
        messageType: "voice",
        metadata: { duration: durationSec },
      });
    } catch {
      toast.error("Failed to send voice note");
    } finally {
      setIsUploading(false);
      setIsRecordingMode(false);
    }
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
          <div className="relative">
            <button onClick={() => setShowChatMenu(!showChatMenu)} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
              <MoreVertical className="w-5 h-5 text-muted-foreground" />
            </button>
            <AnimatePresence>
              {showChatMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute right-0 top-11 glass-strong rounded-xl overflow-hidden min-w-[160px] z-50"
                >
                  <button
                    onClick={handleBlockFromChat}
                    disabled={blockUser.isPending || isOtherBlocked}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  >
                    <ShieldBan className="w-4 h-4" />
                    {isOtherBlocked ? "Already Blocked" : "Block User"}
                  </button>
                  <button
                    onClick={() => { setShowReportModal(true); setShowChatMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-secondary/50 transition-colors border-t border-border/30"
                  >
                    <Flag className="w-4 h-4" />
                    Report User
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
            const isImage = msg.messageType === "image";
            const isVoice = msg.messageType === "voice";

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
                  {isImage ? (
                    <button onClick={() => setLightboxSrc(msg.content)} className="block">
                      <img
                        src={msg.content}
                        alt="Shared image"
                        className="rounded-lg max-w-full max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        loading="lazy"
                      />
                    </button>
                  ) : isVoice ? (
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Mic className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-xs font-semibold">Voice Note</span>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  )}
                  {isVoice && (
                    <AudioMessage
                      src={msg.content}
                      duration={msg.metadata?.duration}
                      isMe={isMe}
                    />
                  )}
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
        <div className="max-w-lg mx-auto">
          {isRecordingMode ? (
            <VoiceRecorder
              onSend={handleSendVoiceNote}
              disabled={isUploading}
            />
          ) : (
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-50"
              >
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Image className="w-5 h-5 text-muted-foreground" />
                )}
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
                <button
                  onClick={() => setIsRecordingMode(true)}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <Mic className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />

      {/* Tip Modal */}
      <TipModal
        isOpen={showTipModal}
        onClose={() => setShowTipModal(false)}
        onSendTip={handleSendTip}
        recipientName={convInfo?.name || ""}
      />

      <ReportUserModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUserId={convInfo?.otherId || ""}
        reportedName={convInfo?.name || "User"}
      />
    </div>
  );
};

export default ChatPage;
