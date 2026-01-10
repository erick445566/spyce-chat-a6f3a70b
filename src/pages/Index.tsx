import { useState, useEffect } from "react";
import { useAuth, AuthProvider } from "@/contexts/AuthContext";
import AuthScreen from "@/components/AuthScreen";
import ChatListView from "@/components/ChatListView";
import ConversationView from "@/components/ConversationView";
import SettingsView from "@/components/SettingsView";
import { Loader2, Flame } from "lucide-react";

type View = "chats" | "chat" | "settings";

const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("spyce-dark-mode");
      if (saved !== null) return saved === "true";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("spyce-dark-mode", String(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  return { isDarkMode, toggleDarkMode };
};

const MainApp = () => {
  const { user, loading } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [view, setView] = useState<View>("chats");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const handleSelectChat = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setView("chat");
  };

  const handleBack = () => {
    setView("chats");
    setSelectedConversationId(null);
  };

  const handleOpenSettings = () => {
    setView("settings");
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl spyce-gradient shadow-spyce-lg mb-4">
          <Flame className="w-8 h-8 text-white" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="h-screen w-full overflow-hidden">
      {/* Mobile Layout */}
      <div className="h-full md:hidden">
        {view === "chats" && (
          <ChatListView
            onSelectChat={handleSelectChat}
            selectedChatId={selectedConversationId || undefined}
            onOpenSettings={handleOpenSettings}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
          />
        )}
        {view === "chat" && selectedConversationId && (
          <ConversationView
            conversationId={selectedConversationId}
            onBack={handleBack}
          />
        )}
        {view === "settings" && (
          <SettingsView
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
            <SettingsView
              onBack={() => setView("chats")}
              isDarkMode={isDarkMode}
              onToggleDarkMode={toggleDarkMode}
            />
          ) : (
            <ChatListView
              onSelectChat={handleSelectChat}
              selectedChatId={selectedConversationId || undefined}
              onOpenSettings={handleOpenSettings}
              isDarkMode={isDarkMode}
              onToggleDarkMode={toggleDarkMode}
            />
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {selectedConversationId ? (
            <ConversationView
              conversationId={selectedConversationId}
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

const Index = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default Index;
