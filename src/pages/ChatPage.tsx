import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Send, Image, MoreVertical,
  DollarSign, ShieldBan, Flag, Mic,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
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
import { useReactions, useToggleReaction } from "@/hooks/use-reactions";
import { useUploadToBucket } from "@/features/media/use-upload-to-bucket";
import MediaPickerButton from "@/features/media/MediaPickerButton";
import IconButton from "@/components/mobile/IconButton";
import { useKeyboardInset } from "@/hooks/use-keyboard-inset";
import { haptics } from "@/platform/haptics";
import VirtualMessageList from "@/features/chat/components/VirtualMessageList";

const ChatPage = () => {
  const { id: conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [showTipModal, setShowTipModal] = useState(false);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [isRecordingMode, setIsRecordingMode] = useState(false);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const keyboardInset = useKeyboardInset();

  const { data: messages = [], isLoading } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  const { setTyping } = usePresence();
  const isOtherTyping = useTypingIndicator(conversationId);
  const blockUser = useBlockUser();
  const { data: blockedUsers = [] } = useBlockedUsers();
  const { data: reactionsMap = {} } = useReactions(conversationId);
  const toggleReaction = useToggleReaction(conversationId);
  const { upload, isUploading } = useUploadToBucket();

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

  const handleTyping = useCallback(() => {
    if (!conversationId) return;
    setTyping(conversationId);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setTyping(null), 2000);
  }, [conversationId, setTyping]);

  const handleSend = () => {
    if (!message.trim() || !conversationId) return;
    haptics.impact("light");
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

  const handleImagePicked = async (file: File) => {
    if (!conversationId || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    try {
      const result = await upload("chat-images", user.id, file);
      sendMessage.mutate({
        conversationId,
        content: result.publicUrl,
        messageType: "image",
        metadata: { fileName: result.fileName, fileSize: result.fileSize },
      });
    } catch {
      toast.error("Failed to upload image");
    }
  };

  const handleSendVoiceNote = async (blob: Blob, durationSec: number) => {
    if (!conversationId || !user) return;
    try {
      const result = await upload("voice-notes", user.id, blob, { extension: "webm" });
      sendMessage.mutate({
        conversationId,
        content: result.publicUrl,
        messageType: "voice",
        metadata: { duration: durationSec },
      });
    } catch {
      toast.error("Failed to send voice note");
    } finally {
      setIsRecordingMode(false);
    }
  };

  if (!conversationId) return null;

  return (
    <div className="min-h-screen-d h-screen-d flex flex-col">
      {/* Header */}
      <header className="glass-strong border-b border-border/50 flex-shrink-0 safe-top">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <IconButton onClick={() => navigate("/chat")} aria-label="Back" className="w-11 h-11">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </IconButton>
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <img src={convInfo?.avatar || "/placeholder.svg"} alt="" className="w-10 h-10 rounded-full object-cover" />
              {convInfo?.isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-accent border-2 border-background" />}
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
          <IconButton onClick={() => setShowTipModal(true)} aria-label="Send tip" className="w-11 h-11">
            <DollarSign className="w-5 h-5 text-gold" />
          </IconButton>
          <div className="relative">
            <IconButton
              onClick={() => setShowChatMenu(!showChatMenu)}
              aria-label="More options"
              className="w-11 h-11"
            >
              <MoreVertical className="w-5 h-5 text-muted-foreground" />
            </IconButton>
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
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <VirtualMessageList
          messages={messages}
          currentUserId={user?.id || ""}
          reactionsMap={reactionsMap}
          isOtherTyping={isOtherTyping}
          activeReactionMsgId={activeReactionMsgId}
          onSetActiveReaction={setActiveReactionMsgId}
          onToggleReaction={(messageId, emoji) => toggleReaction.mutate({ messageId, emoji })}
          onOpenLightbox={setLightboxSrc}
        />
      )}

      {/* Input */}
      <div
        className="glass-strong border-t border-border/50 px-4 py-3 flex-shrink-0 safe-bottom"
        style={{ paddingBottom: keyboardInset > 0 ? keyboardInset + 12 : undefined }}
      >
        <div className="max-w-lg mx-auto">
          {isRecordingMode ? (
            <VoiceRecorder onSend={handleSendVoiceNote} disabled={isUploading} />
          ) : (
            <div className="flex items-end gap-2">
              <MediaPickerButton
                onPicked={handleImagePicked}
                accept="image/*"
                maxSizeMB={5}
                disabled={isUploading}
                ariaLabel="Attach image"
                className="tap-target press inline-flex items-center justify-center rounded-full text-muted-foreground hover:bg-secondary disabled:opacity-50"
              >
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Image className="w-5 h-5" />
                )}
              </MediaPickerButton>
              <div className="flex-1 relative">
                <input
                  type="text"
                  inputMode="text"
                  enterKeyHint="send"
                  autoComplete="off"
                  autoCorrect="on"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); handleTyping(); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  className="w-full bg-secondary rounded-full px-4 py-3 text-base text-foreground placeholder:text-muted-foreground
                             focus:outline-none focus:ring-1 focus:ring-gold/50 selectable"
                />
              </div>
              {message.trim() ? (
                <IconButton onClick={handleSend} aria-label="Send" variant="primary">
                  <Send className="w-4 h-4" />
                </IconButton>
              ) : (
                <IconButton
                  onClick={() => { haptics.impact("medium"); setIsRecordingMode(true); }}
                  aria-label="Record voice"
                >
                  <Mic className="w-5 h-5 text-muted-foreground" />
                </IconButton>
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
