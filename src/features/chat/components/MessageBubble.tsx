import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mic, SmilePlus, Check, CheckCheck } from "lucide-react";
import AudioMessage from "@/components/chat/AudioMessage";
import { MessageReactions, QUICK_EMOJIS } from "@/components/chat/MessageReactions";
import type { Reaction } from "@/hooks/use-reactions";
import type { Message } from "@/features/chat/types";
import { haptics } from "@/platform/haptics";
import { memo } from "react";

interface MessageBubbleProps {
  msg: Message;
  isMe: boolean;
  currentUserId: string;
  reactions: Reaction[];
  activeReactionMsgId: string | null;
  onSetActiveReaction: (id: string | null) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onOpenLightbox: (src: string) => void;
}

const StatusIcon = ({ msg, currentUserId }: { msg: Message; currentUserId: string }) => {
  if (msg.senderId !== currentUserId) return null;
  if (msg.readAt) {
    return (
      <span className="inline-flex items-center gap-0.5 group/read relative">
        <CheckCheck className="w-3 h-3 text-gold" />
        <span className="absolute bottom-full right-0 mb-1 hidden group-hover/read:block whitespace-nowrap text-[9px] bg-popover text-popover-foreground px-2 py-1 rounded-lg shadow-lg border border-border/50">
          Read {new Date(msg.readAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </span>
      </span>
    );
  }
  return <Check className="w-3 h-3 text-muted-foreground" />;
};

const MessageBubble = ({
  msg,
  isMe,
  currentUserId,
  reactions,
  activeReactionMsgId,
  onSetActiveReaction,
  onToggleReaction,
  onOpenLightbox,
}: MessageBubbleProps) => {
  const isTip = msg.messageType === "tip";
  const isImage = msg.messageType === "image";
  const isVoice = msg.messageType === "voice";

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} group/msg`}>
      <div className="relative max-w-[75%]">
        <button
          onClick={() => onSetActiveReaction(activeReactionMsgId === msg.id ? null : msg.id)}
          aria-label="Add reaction"
          className={`absolute top-1 ${isMe ? "-left-8" : "-right-8"} w-7 h-7 rounded-full bg-secondary/80 border border-border/30 items-center justify-center opacity-0 group-hover/msg:opacity-100 transition-opacity hidden sm:flex`}
        >
          <SmilePlus className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isTip
              ? "gradient-gold text-primary-foreground rounded-br-sm glow-gold"
              : isMe
                ? "gradient-gold text-primary-foreground rounded-br-sm"
                : "glass rounded-bl-sm"
          }`}
          onDoubleClick={() => onSetActiveReaction(activeReactionMsgId === msg.id ? null : msg.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            haptics.impact("medium");
            onSetActiveReaction(activeReactionMsgId === msg.id ? null : msg.id);
          }}
        >
          {isTip && (
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">Tip</span>
            </div>
          )}
          {isImage ? (
            <button onClick={() => onOpenLightbox(msg.content)} className="block">
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
            <AudioMessage src={msg.content} duration={msg.metadata?.duration} isMe={isMe} />
          )}
          <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
            <span className={`text-[10px] ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </span>
            <StatusIcon msg={msg} currentUserId={currentUserId} />
          </div>
        </div>

        <AnimatePresence>
          {activeReactionMsgId === msg.id && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 4 }}
              className={`absolute z-50 ${isMe ? "right-0" : "left-0"} -top-10 glass-strong rounded-xl px-2 py-1.5 flex gap-1`}
            >
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onToggleReaction(msg.id, emoji);
                    onSetActiveReaction(null);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-secondary/80 flex items-center justify-center text-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {reactions?.length > 0 && (
          <MessageReactions
            reactions={reactions}
            currentUserId={currentUserId}
            onToggle={(emoji) => onToggleReaction(msg.id, emoji)}
            isMe={isMe}
          />
        )}
      </div>
    </div>
  );
};

export default memo(MessageBubble);