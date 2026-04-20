import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import MessageBubble from "./MessageBubble";
import type { Message } from "@/features/chat/types";
import type { Reaction } from "@/hooks/use-reactions";

interface VirtualMessageListProps {
  messages: Message[];
  currentUserId: string;
  reactionsMap: Record<string, Reaction[]>;
  isOtherTyping: boolean;
  activeReactionMsgId: string | null;
  onSetActiveReaction: (id: string | null) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onOpenLightbox: (src: string) => void;
}

// Threshold (px) — if user is within this distance of the bottom we treat
// them as "pinned" and auto-scroll on new messages. Otherwise show the
// jump-to-latest button.
const PIN_THRESHOLD = 120;

const VirtualMessageList = ({
  messages,
  currentUserId,
  reactionsMap,
  isOtherTyping,
  activeReactionMsgId,
  onSetActiveReaction,
  onToggleReaction,
  onOpenLightbox,
}: VirtualMessageListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [isPinned, setIsPinned] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenCountRef = useRef(messages.length);

  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    // Reasonable starting estimate; dynamic measurement handles the rest.
    estimateSize: () => 72,
    overscan: 8,
    measureElement:
      typeof ResizeObserver !== "undefined"
        ? (el) => el.getBoundingClientRect().height
        : undefined,
    getItemKey: (index) => messages[index]?.id ?? index,
  });

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const el = parentRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior });
      setUnreadCount(0);
    },
    [],
  );

  // Initial mount: jump straight to the bottom (no animation).
  useLayoutEffect(() => {
    if (messages.length > 0) {
      scrollToBottom("auto");
      lastSeenCountRef.current = messages.length;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // New messages: auto-stick if pinned, otherwise increment unread count.
  useEffect(() => {
    const delta = messages.length - lastSeenCountRef.current;
    if (delta <= 0) {
      lastSeenCountRef.current = messages.length;
      return;
    }
    if (isPinned) {
      // wait a frame so the new row is measured before we scroll
      requestAnimationFrame(() => scrollToBottom("smooth"));
    } else {
      // Only count messages from others as "unread"
      const newFromOthers = messages
        .slice(-delta)
        .filter((m) => m.senderId !== currentUserId).length;
      if (newFromOthers > 0) setUnreadCount((c) => c + newFromOthers);
    }
    lastSeenCountRef.current = messages.length;
  }, [messages, isPinned, currentUserId, scrollToBottom]);

  // Keep typing indicator visible if pinned
  useEffect(() => {
    if (isOtherTyping && isPinned) {
      requestAnimationFrame(() => scrollToBottom("smooth"));
    }
  }, [isOtherTyping, isPinned, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = parentRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const pinned = distFromBottom < PIN_THRESHOLD;
    setIsPinned(pinned);
    if (pinned && unreadCount > 0) setUnreadCount(0);
  }, [unreadCount]);

  const items = rowVirtualizer.getVirtualItems();

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={parentRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto scroll-smooth-touch px-4 py-4"
      >
        <div
          className="max-w-lg mx-auto w-full relative"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {items.map((virtualRow) => {
            const msg = messages[virtualRow.index];
            if (!msg) return null;
            const isMe = msg.senderId === currentUserId;
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                className="absolute left-0 right-0 pb-3"
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                <MessageBubble
                  msg={msg}
                  isMe={isMe}
                  currentUserId={currentUserId}
                  reactions={reactionsMap[msg.id] || []}
                  activeReactionMsgId={activeReactionMsgId}
                  onSetActiveReaction={onSetActiveReaction}
                  onToggleReaction={onToggleReaction}
                  onOpenLightbox={onOpenLightbox}
                />
              </div>
            );
          })}
        </div>

        {/* Typing indicator sits below the virtualized list */}
        {isOtherTyping && (
          <div className="max-w-lg mx-auto w-full">
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
          </div>
        )}
      </div>

      {/* Jump to latest */}
      <AnimatePresence>
        {!isPinned && (
          <motion.button
            key="jump-to-latest"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.18 }}
            onClick={() => scrollToBottom("smooth")}
            aria-label="Jump to latest messages"
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1.5 px-3 py-2 rounded-full glass-strong border border-border/50 shadow-lg tap-target press"
          >
            <ChevronDown className="w-4 h-4 text-foreground" />
            {unreadCount > 0 ? (
              <span className="text-xs font-semibold text-foreground">
                {unreadCount} new {unreadCount === 1 ? "message" : "messages"}
              </span>
            ) : (
              <span className="text-xs font-medium text-foreground">Jump to latest</span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VirtualMessageList;