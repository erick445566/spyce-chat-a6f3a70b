import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppRole } from "@/types/chat";

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      name, 
      participantIds,
      avatarUrl,
      description
    }: { 
      name: string;
      participantIds: string[];
      avatarUrl?: string;
      description?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Create the group conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          name,
          is_group: true,
          created_by: user.id,
          avatar_url: avatarUrl,
          description,
          conversation_type: 'group',
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add all participants including the creator as admin
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
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useAddGroupMember = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      userId,
      role = 'member'
    }: { 
      conversationId: string;
      userId: string;
      role?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("conversation_participants")
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          role,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["group-members", variables.conversationId] });
    },
  });
};

export const useRemoveGroupMember = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      userId 
    }: { 
      conversationId: string;
      userId: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("conversation_participants")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["group-members", variables.conversationId] });
    },
  });
};

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      userId,
      role
    }: { 
      conversationId: string;
      userId: string;
      role: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("conversation_participants")
        .update({ role })
        .eq("conversation_id", conversationId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["group-members", variables.conversationId] });
    },
  });
};

export const useMuteMember = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      userId,
      mutedUntil
    }: { 
      conversationId: string;
      userId: string;
      mutedUntil?: string | null;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("conversation_participants")
        .update({ 
          is_muted: !!mutedUntil,
          muted_until: mutedUntil 
        })
        .eq("conversation_id", conversationId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["group-members", variables.conversationId] });
    },
  });
};

export const useGroupMembers = (conversationId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["group-members", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from("conversation_participants")
        .select(`
          *,
          profile:profiles (*)
        `)
        .eq("conversation_id", conversationId);

      if (error) throw error;
      return data;
    },
    enabled: !!conversationId && !!user?.id,
  });
};

export const useUserGroupRole = (conversationId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-group-role", conversationId, user?.id],
    queryFn: async () => {
      if (!conversationId || !user?.id) return null;

      const { data, error } = await supabase
        .from("conversation_participants")
        .select("role")
        .eq("conversation_id", conversationId)
        .eq("user_id", user.id)
        .single();

      if (error) return null;
      return data?.role as AppRole | null;
    },
    enabled: !!conversationId && !!user?.id,
  });
};
