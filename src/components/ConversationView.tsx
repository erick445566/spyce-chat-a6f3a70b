import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Mic,
  Send,
  Smile,
  Image,
  Camera,
  FileText,
  X,
  Check,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useMessages, useSendMessage, useConversations } from "@/hooks/useChat";
import { useAuth } from "@/contexts/AuthContext";
import { MessageWithSender, ConversationWithDetails } from "@/types/chat";

interface ChatViewProps {
  conversationId: string;
  onBack: () => void;
}

const ConversationView = ({ conversationId, onBack }: ChatViewProps) => {
  const [newMessage, setNewMessage] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const { data: messages = [], isLoading: loadingMessages } = useMessages(conversationId);
  const { data: conversations = [] } = useConversations();
  const sendMessage = useSendMessage();

  const conversation = conversations.find((c) => c.id === conversationId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getConversationName = (conv: ConversationWithDetails) => {
    if (conv.is_group && conv.name) return conv.name;
    const otherParticipant = conv.participants.find((p) => p.user_id !== user?.id);
    return otherParticipant?.profile?.display_name || otherParticipant?.profile?.username || "Chat";
  };

  const isOnline = (conv: ConversationWithDetails) => {
    if (conv.is_group) return false;
    const otherParticipant = conv.participants.find((p) => p.user_id !== user?.id);
    return otherParticipant?.profile?.is_online && !otherParticipant?.profile?.hide_online_status;
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      await sendMessage.mutateAsync({
        conversation_id: conversationId,
        content: newMessage.trim(),
        message_type: "text",
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border glass">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-xl md:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="relative">
          <div className="w-10 h-10 rounded-xl spyce-gradient flex items-center justify-center text-white font-semibold">
            {getConversationName(conversation).charAt(0)}
          </div>
          {isOnline(conversation) && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-spyce-online rounded-full border-2 border-background" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{getConversationName(conversation)}</h2>
          <p className="text-xs text-muted-foreground">
            {isOnline(conversation) ? "Online" : "Offline"}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <Phone className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <Video className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <p className="text-muted-foreground">
              Nenhuma mensagem ainda.<br />
              Comece a conversa!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isSent={message.sender_id === user?.id}
              formatTime={formatTime}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Menu */}
      {showAttachments && (
        <div className="absolute bottom-20 left-4 right-4 p-4 glass rounded-2xl animate-scale-in">
          <div className="flex justify-around">
            <AttachmentOption icon={<Image />} label="Foto" color="bg-blue-500" />
            <AttachmentOption icon={<Camera />} label="Câmera" color="bg-pink-500" />
            <AttachmentOption icon={<FileText />} label="Documento" color="bg-purple-500" />
            <AttachmentOption icon={<Mic />} label="Áudio" color="bg-green-500" />
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border glass">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl flex-shrink-0"
            onClick={() => setShowAttachments(!showAttachments)}
          >
            {showAttachments ? (
              <X className="w-5 h-5" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </Button>

          <div className="flex-1 relative">
            <Input
              placeholder="Digite uma mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pr-12 bg-secondary border-0"
              disabled={sendMessage.isPending}
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <Smile className="w-5 h-5" />
            </button>
          </div>

          <Button
            variant={newMessage.trim() ? "spyce" : "secondary"}
            size="icon"
            className="rounded-xl flex-shrink-0"
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMessage.isPending}
          >
            {sendMessage.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : newMessage.trim() ? (
              <Send className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({
  message,
  isSent,
  formatTime,
}: {
  message: MessageWithSender;
  isSent: boolean;
  formatTime: (date: string) => string;
}) => {
  return (
    <div className={cn("flex", isSent ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] px-4 py-2.5 animate-scale-in",
          isSent ? "chat-bubble-sent" : "chat-bubble-received"
        )}
      >
        {!isSent && message.sender && (
          <p className="text-xs font-medium text-primary mb-1">
            {message.sender.display_name || message.sender.username}
          </p>
        )}
        <p className="text-sm leading-relaxed">{message.content}</p>
        <div
          className={cn(
            "flex items-center justify-end gap-1 mt-1",
            isSent ? "text-white/70" : "text-muted-foreground"
          )}
        >
          <span className="text-[10px]">{formatTime(message.created_at)}</span>
          {isSent && <CheckCheck className="w-3 h-3" />}
        </div>
      </div>
    </div>
  );
};

const AttachmentOption = ({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
}) => (
  <button className="flex flex-col items-center gap-2">
    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white", color)}>
      {icon}
    </div>
    <span className="text-xs text-muted-foreground">{label}</span>
  </button>
);

export default ConversationView;
