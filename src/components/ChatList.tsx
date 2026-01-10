import { useState } from "react";
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Users, 
  Settings,
  Moon,
  Sun,
  User
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Chat {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  isGroup?: boolean;
}

const mockChats: Chat[] = [
  {
    id: "1",
    name: "Maria Silva",
    lastMessage: "Oi! Tudo bem com você? 😊",
    time: "10:32",
    unread: 2,
    online: true,
  },
  {
    id: "2",
    name: "Grupo da Família",
    lastMessage: "João: Bom dia pessoal!",
    time: "09:15",
    unread: 5,
    online: false,
    isGroup: true,
  },
  {
    id: "3",
    name: "Pedro Santos",
    lastMessage: "Beleza, combinado então 👍",
    time: "Ontem",
    unread: 0,
    online: true,
  },
  {
    id: "4",
    name: "Ana Costa",
    lastMessage: "Você viu aquele vídeo?",
    time: "Ontem",
    unread: 0,
    online: false,
  },
  {
    id: "5",
    name: "Trabalho - Projeto X",
    lastMessage: "Laura: Reunião às 15h",
    time: "Seg",
    unread: 0,
    online: false,
    isGroup: true,
  },
];

interface ChatListProps {
  onSelectChat: (chatId: string) => void;
  selectedChatId?: string;
  onOpenSettings: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const ChatList = ({ 
  onSelectChat, 
  selectedChatId, 
  onOpenSettings,
  isDarkMode,
  onToggleDarkMode 
}: ChatListProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = mockChats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">
            <span className="spyce-gradient-text">Spyce</span> Chat
          </h1>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleDarkMode}
              className="rounded-xl"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSettings}
              className="rounded-xl"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Pesquisar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-secondary border-0"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2">
        {filteredChats.map((chat) => (
          <ChatItem
            key={chat.id}
            chat={chat}
            isSelected={selectedChatId === chat.id}
            onClick={() => onSelectChat(chat.id)}
          />
        ))}
      </div>

      {/* FAB */}
      <div className="absolute bottom-6 right-6">
        <Button
          variant="spyce"
          size="icon"
          className="w-14 h-14 rounded-2xl"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

const ChatItem = ({
  chat,
  isSelected,
  onClick,
}: {
  chat: Chat;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 mb-1",
      isSelected
        ? "bg-accent"
        : "hover:bg-secondary"
    )}
  >
    {/* Avatar */}
    <div className="relative flex-shrink-0">
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-semibold",
        chat.isGroup 
          ? "bg-secondary text-secondary-foreground" 
          : "spyce-gradient text-white"
      )}>
        {chat.isGroup ? (
          <Users className="w-5 h-5" />
        ) : (
          chat.name.charAt(0)
        )}
      </div>
      {chat.online && !chat.isGroup && (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-spyce-online rounded-full border-2 border-background online-pulse" />
      )}
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0 text-left">
      <div className="flex items-center justify-between mb-0.5">
        <span className="font-semibold truncate">{chat.name}</span>
        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
          {chat.time}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground truncate">
          {chat.lastMessage}
        </span>
        {chat.unread > 0 && (
          <span className="flex-shrink-0 ml-2 min-w-5 h-5 px-1.5 rounded-full spyce-gradient text-white text-xs font-medium flex items-center justify-center">
            {chat.unread}
          </span>
        )}
      </div>
    </div>
  </button>
);

export default ChatList;
