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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isSent: boolean;
  status: "sending" | "sent" | "delivered" | "read";
  type: "text" | "image" | "audio" | "document";
}

const mockMessages: Message[] = [
  {
    id: "1",
    content: "Oi! Tudo bem?",
    timestamp: "10:30",
    isSent: false,
    status: "read",
    type: "text",
  },
  {
    id: "2",
    content: "Oi! Tudo ótimo e você? 😊",
    timestamp: "10:31",
    isSent: true,
    status: "read",
    type: "text",
  },
  {
    id: "3",
    content: "Estou bem também! Vamos marcar algo para esse fim de semana?",
    timestamp: "10:31",
    isSent: false,
    status: "read",
    type: "text",
  },
  {
    id: "4",
    content: "Claro! O que você tem em mente?",
    timestamp: "10:32",
    isSent: true,
    status: "read",
    type: "text",
  },
  {
    id: "5",
    content: "Podemos ir àquele restaurante novo que abriu no centro. Ouvi dizer que é muito bom!",
    timestamp: "10:32",
    isSent: false,
    status: "read",
    type: "text",
  },
  {
    id: "6",
    content: "Boa ideia! Sábado à noite então?",
    timestamp: "10:33",
    isSent: true,
    status: "delivered",
    type: "text",
  },
];

interface ChatViewProps {
  chatId: string;
  chatName: string;
  isOnline?: boolean;
  onBack: () => void;
}

const ChatView = ({ chatId, chatName, isOnline = true, onBack }: ChatViewProps) => {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      timestamp: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isSent: true,
      status: "sending",
      type: "text",
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");

    // Simulate message status updates
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, status: "sent" } : m))
      );
    }, 500);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, status: "delivered" } : m))
      );
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
            {chatName.charAt(0)}
          </div>
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-spyce-online rounded-full border-2 border-background" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{chatName}</h2>
          <p className="text-xs text-muted-foreground">
            {isOnline ? "Online" : "Visto por último às 10:30"}
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
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
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
            disabled={!newMessage.trim()}
          >
            {newMessage.trim() ? (
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

const MessageBubble = ({ message }: { message: Message }) => {
  const StatusIcon = () => {
    switch (message.status) {
      case "sending":
        return <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />;
      case "sent":
        return <Check className="w-3 h-3" />;
      case "delivered":
        return <CheckCheck className="w-3 h-3" />;
      case "read":
        return <CheckCheck className="w-3 h-3 text-blue-400" />;
    }
  };

  return (
    <div
      className={cn(
        "flex",
        message.isSent ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] px-4 py-2.5 animate-scale-in",
          message.isSent ? "chat-bubble-sent" : "chat-bubble-received"
        )}
      >
        <p className="text-sm leading-relaxed">{message.content}</p>
        <div
          className={cn(
            "flex items-center justify-end gap-1 mt-1",
            message.isSent ? "text-white/70" : "text-muted-foreground"
          )}
        >
          <span className="text-[10px]">{message.timestamp}</span>
          {message.isSent && <StatusIcon />}
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

export default ChatView;
