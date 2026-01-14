import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CommunityWithDetails, AppRole } from "@/types/chat";
import { useEffect } from "react";

export const useCommunities = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["communities", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get communities the user is a member of
      const { data: memberships, error: memberError } = await supabase
        .from("community_members")
        .select(`
          community_id,
          role,
          community:communities (*)
        `)
        .eq("user_id", user.id);

      if (memberError) throw memberError;
      if (!memberships || memberships.length === 0) return [];

      const communityIds = memberships.map((m) => m.community_id);

      // Get all members for these communities
      const { data: allMembers, error: allMemberError } = await supabase
        .from("community_members")
        .select(`
          *,
          profile:profiles (*)
        `)
        .in("community_id", communityIds);

      if (allMemberError) throw allMemberError;

      // Build community objects
      const communities: CommunityWithDetails[] = memberships.map((m) => {
        const community = m.community as any;
        const members = (allMembers || [])
          .filter((am) => am.community_id === m.community_id)
          .map((am) => ({
            ...am,
            profile: am.profile,
          }));

        return {
          ...community,
          members,
          memberCount: members.length,
        };
      });

      return communities;
    },
    enabled: !!user?.id,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("communities-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "communities",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["communities"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "community_members",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["communities"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
};

export const usePublicCommunities = (searchQuery: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["public-communities", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];

      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .eq("is_public", true)
        .ilike("name", `%${searchQuery}%`)
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && searchQuery.length >= 2,
  });
};

export const useCreateCommunity = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      name, 
      description,
      avatarUrl,
      isPublic = true
    }: { 
      name: string;
      description?: string;
      avatarUrl?: string;
      isPublic?: boolean;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Create the community
      const { data: community, error: communityError } = await supabase
        .from("communities")
        .insert({
          name,
          description,
          avatar_url: avatarUrl,
          is_public: isPublic,
          created_by: user.id,
        })
        .select()
        .single();

      if (communityError) throw communityError;

      // Add creator as admin
      const { error: memberError } = await supabase
        .from("community_members")
        .insert({
          community_id: community.id,
          user_id: user.id,
          role: 'admin',
        });

      if (memberError) throw memberError;

      return community;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });
};

export const useJoinCommunity = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (communityId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("community_members")
        .insert({
          community_id: communityId,
          user_id: user.id,
          role: 'member',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });
};

export const useLeaveCommunity = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (communityId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", communityId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });
};

export const useAddCommunityMember = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      communityId, 
      userId,
      role = 'member'
    }: { 
      communityId: string;
      userId: string;
      role?: AppRole;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("community_members")
        .insert({
          community_id: communityId,
          user_id: userId,
          role,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      queryClient.invalidateQueries({ queryKey: ["community-members", variables.communityId] });
    },
  });
};

export const useRemoveCommunityMember = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      communityId, 
      userId 
    }: { 
      communityId: string;
      userId: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", communityId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      queryClient.invalidateQueries({ queryKey: ["community-members", variables.communityId] });
    },
  });
};

export const useUpdateCommunityMemberRole = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      communityId, 
      userId,
      role
    }: { 
      communityId: string;
      userId: string;
      role: AppRole;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("community_members")
        .update({ role })
        .eq("community_id", communityId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["community-members", variables.communityId] });
    },
  });
};

export const useMuteCommunityMember = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      communityId, 
      userId,
      mutedUntil
    }: { 
      communityId: string;
      userId: string;
      mutedUntil?: string | null;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("community_members")
        .update({ 
          is_muted: !!mutedUntil,
          muted_until: mutedUntil 
        })
        .eq("community_id", communityId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["community-members", variables.communityId] });
    },
  });
};

export const useCommunityMembers = (communityId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["community-members", communityId],
    queryFn: async () => {
      if (!communityId) return [];

      const { data, error } = await supabase
        .from("community_members")
        .select(`
          *,
          profile:profiles (*)
        `)
        .eq("community_id", communityId);

      if (error) throw error;
      return data;
    },
    enabled: !!communityId && !!user?.id,
  });
};

export const useUserCommunityRole = (communityId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-community-role", communityId, user?.id],
    queryFn: async () => {
      if (!communityId || !user?.id) return null;

      const { data, error } = await supabase
        .from("community_members")
        .select("role")
        .eq("community_id", communityId)
        .eq("user_id", user.id)
        .single();

      if (error) return null;
      return data?.role as AppRole | null;
    },
    enabled: !!communityId && !!user?.id,
  });
};

export const useUpdateCommunity = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      communityId,
      name,
      description,
      avatarUrl,
      isPublic
    }: { 
      communityId: string;
      name?: string;
      description?: string;
      avatarUrl?: string;
      isPublic?: boolean;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;
      if (isPublic !== undefined) updateData.is_public = isPublic;

      const { data, error } = await supabase
        .from("communities")
        .update(updateData)
        .eq("id", communityId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });
};

export const useDeleteCommunity = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (communityId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("communities")
        .delete()
        .eq("id", communityId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
  });
};
