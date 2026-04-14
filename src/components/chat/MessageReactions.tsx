import { motion, AnimatePresence } from "framer-motion";
import { SmilePlus } from "lucide-react";
import { useState } from "react";
import { Reaction } from "@/hooks/use-reactions";

const QUICK_EMOJIS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];

interface MessageReactionsProps {
  reactions: Reaction[];
  currentUserId: string;
  onToggle: (emoji: string) => void;
  isMe: boolean;
}

const MessageReactions = ({ reactions, currentUserId, onToggle, isMe }: MessageReactionsProps) => {
  const [showPicker, setShowPicker] = useState(false);

  // Group reactions by emoji with counts
  const grouped = reactions.reduce<Record<string, { count: number; hasMe: boolean }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, hasMe: false };
    acc[r.emoji].count++;
    if (r.userId === currentUserId) acc[r.emoji].hasMe = true;
    return acc;
  }, {});

  return (
    <div className="relative">
      {/* Existing reactions */}
      {Object.keys(grouped).length > 0 && (
        <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
          {Object.entries(grouped).map(([emoji, { count, hasMe }]) => (
            <button
              key={emoji}
              onClick={() => onToggle(emoji)}
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors ${
                hasMe
                  ? "bg-accent/30 border border-accent/50"
                  : "bg-secondary/80 border border-border/30 hover:bg-secondary"
              }`}
            >
              <span>{emoji}</span>
              {count > 1 && <span className="text-[10px] text-muted-foreground">{count}</span>}
            </button>
          ))}
          <button
            onClick={() => setShowPicker((p) => !p)}
            className="w-6 h-6 rounded-full bg-secondary/80 border border-border/30 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <SmilePlus className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Emoji picker (inline) */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 4 }}
            className={`absolute z-50 ${isMe ? "right-0" : "left-0"} mt-1 glass-strong rounded-xl px-2 py-1.5 flex gap-1`}
          >
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { onToggle(emoji); setShowPicker(false); }}
                className="w-8 h-8 rounded-lg hover:bg-secondary/80 flex items-center justify-center text-lg transition-colors"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { MessageReactions, QUICK_EMOJIS };
