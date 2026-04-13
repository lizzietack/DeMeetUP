import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Mic, Image, MoreVertical, Check, CheckCheck } from "lucide-react";
import { companions, chatMessages } from "@/data/mock";
import { useState } from "react";

const ChatPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const companion = companions.find((c) => c.id === id);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(chatMessages);

  if (!companion) return null;

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages([...messages, {
      id: `m${messages.length + 1}`,
      senderId: "me",
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      status: "sent",
      type: "text",
    }]);
    setMessage("");
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "read") return <CheckCheck className="w-3 h-3 text-gold" />;
    if (status === "delivered") return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
    return <Check className="w-3 h-3 text-muted-foreground" />;
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="glass-strong border-b border-border/50 flex-shrink-0">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button onClick={() => navigate("/chat")} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => navigate(`/companion/${companion.id}`)}>
            <div className="relative">
              <img src={companion.images[0]} alt={companion.name} className="w-10 h-10 rounded-full object-cover" />
              {companion.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-background" />}
            </div>
            <div>
              <h2 className="font-display font-semibold text-foreground text-sm">{companion.name}</h2>
              <p className="text-[10px] text-muted-foreground">{companion.online ? "Online" : "Last seen recently"}</p>
            </div>
          </div>
          <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors">
            <MoreVertical className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-lg mx-auto w-full">
        {messages.map((msg, i) => {
          const isMe = msg.senderId === "me";
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                isMe
                  ? "gradient-gold text-primary-foreground rounded-br-sm"
                  : "glass rounded-bl-sm"
              }`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <div className={`flex items-center gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}>
                  <span className={`text-[10px] ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.timestamp}</span>
                  {isMe && <StatusIcon status={msg.status} />}
                </div>
              </div>
            </motion.div>
          );
        })}
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
              onChange={(e) => setMessage(e.target.value)}
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
    </div>
  );
};

export default ChatPage;
