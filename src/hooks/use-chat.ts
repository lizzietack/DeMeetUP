/**
 * Compatibility shim — chat hooks have been split into
 * src/features/chat/hooks/* for clarity and React-Native portability.
 * Existing imports from "@/hooks/use-chat" continue to work.
 */
export {
  useConversations,
  useMessages,
  useSendMessage,
  useStartConversation,
  usePresence,
  useTypingIndicator,
} from "@/features/chat/hooks";
export type { Conversation, Message } from "@/features/chat/hooks";