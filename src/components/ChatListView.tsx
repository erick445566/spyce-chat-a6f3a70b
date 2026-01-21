import { useState } from "react";
import { 
  Search, 
  Plus, 
  Settings,
  Moon,
  Sun,
  Users,
  X,
  UserPlus,
  Loader2,
  UsersRound,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useConversations, useCreateConversation } from "@/hooks/useChat";
import { useSearchUsers, useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { ConversationWithDetails, Profile } from "@/types/chat";
import CreateGroupModal from "./CreateGroupModal";
import CommunitiesView from "./CommunitiesView";

interface ChatListProps {
  onSelectChat: (conversationId: string) => void;
  selectedChatId?: string;
  onOpenSettings: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

const ChatListView = ({ 
  onSelectChat, 
  selectedChatId, 
  onOpenSettings,
  isDarkMode,
  onToggleDarkMode 
}: ChatListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCommunities, setShowCommunities] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: conversations = [], isLoading } = useConversations();
  const { data: searchResults = [], isLoading: searchingUsers } = useSearchUsers(userSearchQuery);
  const createConversation = useCreateConversation();

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    
    const searchLower = searchQuery.toLowerCase();
    if (conv.name?.toLowerCase().includes(searchLower)) return true;
    
    // Check participant names
    return conv.participants.some(
      (p) => 
        p.profile?.username?.toLowerCase().includes(searchLower) ||
        p.profile?.display_name?.toLowerCase().includes(searchLower)
    );
  });

  const getConversationName = (conv: ConversationWithDetails) => {
    if (conv.is_group && conv.name) return conv.name;
    
    // For private chats, show the other participant's name
    const otherParticipant = conv.participants.find((p) => p.user_id !== user?.id);
    return otherParticipant?.profile?.display_name || otherParticipant?.profile?.username || "Chat";
  };

  const getConversationAvatar = (conv: ConversationWithDetails) => {
    if (conv.is_group) return null;
    const otherParticipant = conv.participants.find((p) => p.user_id !== user?.id);
    return otherParticipant?.profile?.avatar_url;
  };

  const isOnline = (conv: ConversationWithDetails) => {
    if (conv.is_group) return false;
    const otherParticipant = conv.participants.find((p) => p.user_id !== user?.id);
    return otherParticipant?.profile?.is_online && !otherParticipant?.profile?.hide_online_status;
  };

  const handleStartConversation = async (targetUser: Profile) => {
    try {
      const result = await createConversation.mutateAsync({
        participantIds: [targetUser.id],
        isGroup: false,
      });
      
      if (result && result.id) {
        setShowNewChat(false);
        setUserSearchQuery("");
        // Small delay to ensure state updates before navigation
        setTimeout(() => {
          onSelectChat(result.id);
        }, 100);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Ontem";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("pt-BR", { weekday: "short" });
    }
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  return (
    <div className="h-full flex flex-col bg-background relative">
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
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
            </p>
            <Button
              variant="outline"
              onClick={() => setShowNewChat(true)}
              className="gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Iniciar conversa
            </Button>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <ChatItem
              key={conv.id}
              name={getConversationName(conv)}
              avatarUrl={getConversationAvatar(conv)}
              lastMessage={conv.lastMessage?.content || "Nenhuma mensagem"}
              time={conv.lastMessage ? formatTime(conv.lastMessage.created_at) : ""}
              unread={conv.unreadCount || 0}
              online={isOnline(conv)}
              isGroup={conv.is_group}
              isSelected={selectedChatId === conv.id}
              onClick={() => onSelectChat(conv.id)}
            />
          ))
        )}
      </div>

      {/* FAB */}
      <div className="absolute bottom-6 right-6">
        <Button
          variant="spyce"
          size="icon"
          className="w-14 h-14 rounded-2xl"
          onClick={() => setShowNewChat(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="absolute inset-0 bg-background z-50 flex flex-col animate-slide-up">
          <div className="p-4 border-b border-border flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowNewChat(false);
                setUserSearchQuery("");
              }}
              className="rounded-xl"
            >
              <X className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-semibold">Nova conversa</h2>
          </div>
          
          {/* Quick Actions */}
          <div className="p-4 border-b border-border space-y-2">
            <button
              onClick={() => {
                setShowNewChat(false);
                setShowCreateGroup(true);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Novo Grupo</p>
                <p className="text-sm text-muted-foreground">Crie um grupo com seus contatos</p>
              </div>
            </button>
            <button
              onClick={() => {
                setShowNewChat(false);
                setShowCommunities(true);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                <UsersRound className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Comunidades</p>
                <p className="text-sm text-muted-foreground">Explore ou crie comunidades</p>
              </div>
            </button>
          </div>

          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar usuários..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="pl-12 bg-secondary border-0"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2">
            {searchingUsers ? (
              <div className="flex items-center justify-center h-20">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : userSearchQuery && searchResults.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum usuário encontrado
              </p>
            ) : (
              searchResults.map((targetUser) => (
                <button
                  key={targetUser.id}
                  onClick={() => handleStartConversation(targetUser)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary transition-colors"
                  disabled={createConversation.isPending}
                >
                  <div className="w-12 h-12 rounded-2xl spyce-gradient flex items-center justify-center text-white font-semibold">
                    {targetUser.display_name?.charAt(0) || targetUser.username.charAt(0)}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold">{targetUser.display_name || targetUser.username}</p>
                    <p className="text-sm text-muted-foreground">@{targetUser.username}</p>
                  </div>
                  {createConversation.isPending && (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onSuccess={(conversationId) => {
            setShowCreateGroup(false);
            onSelectChat(conversationId);
          }}
        />
      )}

      {/* Communities View */}
      {showCommunities && (
        <div className="absolute inset-0 z-50">
          <CommunitiesView 
            onBack={() => setShowCommunities(false)} 
            onSelectGroup={(conversationId) => {
              setShowCommunities(false);
              onSelectChat(conversationId);
            }}
          />
        </div>
      )}
    </div>
  );
};

const ChatItem = ({
  name,
  avatarUrl,
  lastMessage,
  time,
  unread,
  online,
  isGroup,
  isSelected,
  onClick,
}: {
  name: string;
  avatarUrl?: string | null;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  isGroup: boolean;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 mb-1",
      isSelected ? "bg-accent" : "hover:bg-secondary"
    )}
  >
    {/* Avatar */}
    <div className="relative flex-shrink-0">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-12 h-12 rounded-2xl object-cover"
        />
      ) : (
        <div
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-semibold",
            isGroup
              ? "bg-secondary text-secondary-foreground"
              : "spyce-gradient text-white"
          )}
        >
          {isGroup ? <Users className="w-5 h-5" /> : name.charAt(0)}
        </div>
      )}
      {online && !isGroup && (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-spyce-online rounded-full border-2 border-background online-pulse" />
      )}
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0 text-left">
      <div className="flex items-center justify-between mb-0.5">
        <span className="font-semibold truncate">{name}</span>
        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
          {time}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground truncate">
          {lastMessage}
        </span>
        {unread > 0 && (
          <span className="flex-shrink-0 ml-2 min-w-5 h-5 px-1.5 rounded-full spyce-gradient text-white text-xs font-medium flex items-center justify-center">
            {unread}
          </span>
        )}
      </div>
    </div>
  </button>
);

export default ChatListView;
