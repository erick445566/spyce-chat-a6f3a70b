import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TypingUser {
  id: string;
  username: string;
  display_name?: string;
}

export const useTypingIndicator = (conversationId: string | null) => {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Set up realtime presence for typing indicator
  useEffect(() => {
    if (!conversationId || !user?.id) return;

    const channel = supabase.channel(`typing-${conversationId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const presenceState = channel.presenceState();
        const typing: TypingUser[] = [];
        
        Object.entries(presenceState).forEach(([key, presences]) => {
          if (key !== user.id) {
            const presence = (presences as any[])[0];
            if (presence?.isTyping) {
              typing.push({
                id: key,
                username: presence.username || "Usuário",
                display_name: presence.display_name,
              });
            }
          }
        });
        
        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            isTyping: false,
            username: "",
            display_name: "",
          });
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, user?.id]);

  // Start typing - call this when user starts typing
  const startTyping = useCallback(
    async (profile?: { username?: string; display_name?: string }) => {
      if (!channelRef.current) return;

      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Update presence to show typing
      await channelRef.current.track({
        isTyping: true,
        username: profile?.username || "",
        display_name: profile?.display_name || "",
      });

      // Auto-stop typing after 3 seconds of no input
      typingTimeoutRef.current = setTimeout(async () => {
        await stopTyping();
      }, 3000);
    },
    []
  );

  // Stop typing - call this when user stops typing
  const stopTyping = useCallback(async () => {
    if (!channelRef.current) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    await channelRef.current.track({
      isTyping: false,
      username: "",
      display_name: "",
    });
  }, []);

  return {
    typingUsers,
    startTyping,
    stopTyping,
  };
};
