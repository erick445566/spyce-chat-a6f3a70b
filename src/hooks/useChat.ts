import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ConversationWithDetails, MessageInsert, MessageWithSender } from "@/types/chat";
import { useEffect } from "react";

export const useConversations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get conversations with participants and their profiles
      const { data: participations, error: partError } = await supabase
        .from("conversation_participants")
        .select(`
          conversation_id,
          conversations!inner (
            id,
            name,
            is_group,
            invite_code,
            avatar_url,
            description,
            theme_color,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq("user_id", user.id);

      if (partError) throw partError;
      if (!participations || participations.length === 0) return [];

      const conversationIds = participations.map((p) => p.conversation_id);

      // Get all participants for these conversations
      const { data: allParticipants, error: allPartError } = await supabase
        .from("conversation_participants")
        .select(`
          *,
          profile:profiles (*)
        `)
        .in("conversation_id", conversationIds);

      if (allPartError) throw allPartError;

      // Get last message for each conversation
      const { data: lastMessages, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });

      if (msgError) throw msgError;

      // Build conversation objects
      const conversations: ConversationWithDetails[] = participations.map((p) => {
        const conv = p.conversations as any;
        const participants = (allParticipants || [])
          .filter((ap) => ap.conversation_id === p.conversation_id)
          .map((ap) => ({
            ...ap,
            profile: ap.profile,
          }));

        const lastMessage = (lastMessages || []).find(
          (m) => m.conversation_id === p.conversation_id
        );

        return {
          ...conv,
          participants,
          lastMessage,
          unreadCount: 0, // TODO: Calculate unread count
        };
      });

      // Sort by last message time
      conversations.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.created_at;
        const bTime = b.lastMessage?.created_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      return conversations;
    },
    enabled: !!user?.id,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("conversations-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["conversations"], exact: false });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
};

export const useMessages = (conversationId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles (*)
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as MessageWithSender[];
    },
    enabled: !!conversationId && !!user?.id,
  });

  // Subscribe to realtime message updates
  useEffect(() => {
    if (!conversationId || !user?.id) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id, queryClient]);

  return query;
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (message: Omit<MessageInsert, "sender_id">) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          ...message,
          sender_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["messages", data.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"], exact: false });
    },
  });
};

export const useFindExistingConversation = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Find all private conversations (non-group) where both users are participants
      const { data: myConversations, error: myError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (myError) throw myError;
      if (!myConversations || myConversations.length === 0) return null;

      const myConvIds = myConversations.map(c => c.conversation_id);

      // Check if the other user is in any of these conversations
      const { data: sharedConversations, error: sharedError } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", otherUserId)
        .in("conversation_id", myConvIds);

      if (sharedError) throw sharedError;
      if (!sharedConversations || sharedConversations.length === 0) return null;

      // Get the conversation details to find a private (non-group) one
      const sharedConvIds = sharedConversations.map(c => c.conversation_id);
      
      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .in("id", sharedConvIds)
        .eq("is_group", false)
        .limit(1)
        .maybeSingle();

      if (convError) throw convError;
      return conversations;
    },
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      participantIds, 
      name, 
      isGroup = false 
    }: { 
      participantIds: string[]; 
      name?: string; 
      isGroup?: boolean;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // For private chats (not groups), check if conversation already exists
      if (!isGroup && participantIds.length === 1) {
        const otherUserId = participantIds[0];
        
        // Find all private conversations where both users are participants
        const { data: myConversations } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", user.id);

        if (myConversations && myConversations.length > 0) {
          const myConvIds = myConversations.map(c => c.conversation_id);

          const { data: sharedConversations } = await supabase
            .from("conversation_participants")
            .select("conversation_id")
            .eq("user_id", otherUserId)
            .in("conversation_id", myConvIds);

          if (sharedConversations && sharedConversations.length > 0) {
            const sharedConvIds = sharedConversations.map(c => c.conversation_id);
            
            const { data: existingConv } = await supabase
              .from("conversations")
              .select("*")
              .in("id", sharedConvIds)
              .eq("is_group", false)
              .limit(1)
              .maybeSingle();

            if (existingConv) {
              return existingConv;
            }
          }
        }
      }

      // Create the conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          name: isGroup ? name : null,
          is_group: isGroup,
          created_by: user.id,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add all participants including the creator
      const allParticipantIds = [...new Set([user.id, ...participantIds])];
      
      const { error: partError } = await supabase
        .from("conversation_participants")
        .insert(
          allParticipantIds.map((id) => ({
            conversation_id: conversation.id,
            user_id: id,
            role: id === user.id ? "admin" : "member",
          }))
        );

      if (partError) throw partError;

      return conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"], exact: false });
    },
  });
};

export const useUpdateConversationTheme = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      conversationId,
      themeColor
    }: { 
      conversationId: string;
      themeColor: string | null;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("conversations")
        .update({ theme_color: themeColor })
        .eq("id", conversationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"], exact: false });
    },
  });
};
