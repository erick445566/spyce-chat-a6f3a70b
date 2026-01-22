import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Generate invite code for a community
export const useGenerateCommunityInvite = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (communityId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Generate a random invite code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_invite_code');

      if (codeError) throw codeError;
      const inviteCode = codeData as string;

      // Update the community with the invite code
      const { data, error } = await supabase
        .from("communities")
        .update({ invite_code: inviteCode })
        .eq("id", communityId)
        .select("invite_code")
        .single();

      if (error) throw error;
      return data.invite_code;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });
};

// Generate invite code for a group
export const useGenerateGroupInvite = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Generate a random invite code
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_invite_code');

      if (codeError) throw codeError;
      const inviteCode = codeData as string;

      // Update the conversation with the invite code
      const { data, error } = await supabase
        .from("conversations")
        .update({ invite_code: inviteCode })
        .eq("id", conversationId)
        .select("invite_code")
        .single();

      if (error) throw error;
      return data.invite_code;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

// Join a community via invite code
export const useJoinCommunityByInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data, error } = await supabase
        .rpc('join_community_by_invite', { p_invite_code: inviteCode });

      if (error) throw error;
      return data as string; // Returns the community ID
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });
};

// Join a group via invite code
export const useJoinGroupByInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data, error } = await supabase
        .rpc('join_group_by_invite', { p_invite_code: inviteCode });

      if (error) throw error;
      return data as string; // Returns the conversation ID
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};
