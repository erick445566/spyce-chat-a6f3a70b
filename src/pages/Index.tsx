import { useState, useEffect } from "react";
import WelcomeScreen from "@/components/WelcomeScreen";
import ChatList from "@/components/ChatList";
import ChatView from "@/components/ChatView";
import Settings from "@/components/Settings";

type View = "welcome" | "chats" | "chat" | "settings";

// Mock authenticated state - in production, this would come from auth context
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Simulate auto-login for demo purposes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAuthenticated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return { isAuthenticated };
};

const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  return { isDarkMode, toggleDarkMode };
};

const Index = () => {
  const { isAuthenticated } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [view, setView] = useState<View>("chats");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Chat name mapping for demo
  const getChatName = (chatId: string) => {
    const names: Record<string, string> = {
      "1": "Maria Silva",
      "2": "Grupo da Família",
      "3": "Pedro Santos",
      "4": "Ana Costa",
      "5": "Trabalho - Projeto X",
    };
    return names[chatId] || "Chat";
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setView("chat");
  };

  const handleBack = () => {
    setView("chats");
    setSelectedChatId(null);
  };

  const handleOpenSettings = () => {
    setView("settings");
  };

  // Show welcome screen if not authenticated
  if (!isAuthenticated) {
    return <WelcomeScreen />;
  }

  return (
    <div className="h-screen w-full overflow-hidden">
      {/* Mobile Layout */}
      <div className="h-full md:hidden">
        {view === "chats" && (
          <ChatList
            onSelectChat={handleSelectChat}
            selectedChatId={selectedChatId || undefined}
            onOpenSettings={handleOpenSettings}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
          />
        )}
        {view === "chat" && selectedChatId && (
          <ChatView
            chatId={selectedChatId}
            chatName={getChatName(selectedChatId)}
            isOnline={["1", "3"].includes(selectedChatId)}
            onBack={handleBack}
          />
        )}
        {view === "settings" && (
          <Settings
            onBack={handleBack}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
          />
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex h-full">
        {/* Sidebar */}
        <div className="w-96 border-r border-border relative">
          {view === "settings" ? (
            <Settings
              onBack={() => setView("chats")}
              isDarkMode={isDarkMode}
              onToggleDarkMode={toggleDarkMode}
            />
          ) : (
            <ChatList
              onSelectChat={handleSelectChat}
              selectedChatId={selectedChatId || undefined}
              onOpenSettings={handleOpenSettings}
              isDarkMode={isDarkMode}
              onToggleDarkMode={toggleDarkMode}
            />
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {selectedChatId ? (
            <ChatView
              chatId={selectedChatId}
              chatName={getChatName(selectedChatId)}
              isOnline={["1", "3"].includes(selectedChatId)}
              onBack={handleBack}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="h-full flex flex-col items-center justify-center text-center p-8">
    <div className="w-24 h-24 rounded-3xl spyce-gradient shadow-spyce-lg flex items-center justify-center mb-6">
      <svg
        className="w-12 h-12 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    </div>
    <h2 className="text-2xl font-bold mb-2">
      <span className="spyce-gradient-text">Spyce</span> Chat
    </h2>
    <p className="text-muted-foreground max-w-sm">
      Selecione uma conversa para começar a trocar mensagens de forma privada e segura.
    </p>
  </div>
);

export default Index;
