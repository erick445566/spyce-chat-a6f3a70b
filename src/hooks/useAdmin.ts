import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface UserBan {
  id: string;
  user_id: string;
  banned_by: string;
  reason: string | null;
  banned_at: string;
  expires_at: string | null;
  is_permanent: boolean;
  user?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  banned_by_user?: {
    username: string;
    display_name: string | null;
  };
}

export interface UserWithRole {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  role?: string;
}

// Check if current user is owner
export const useIsOwner = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["isOwner", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .rpc("is_owner", { _user_id: user.id });
      
      if (error) {
        console.error("Error checking owner status:", error);
        return false;
      }
      return data === true;
    },
    enabled: !!user?.id,
  });
};

// Check if current user is admin
export const useIsAdmin = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .rpc("has_role", { _user_id: user.id, _role: "admin" });
      
      if (error) {
        console.error("Error checking admin status:", error);
        return false;
      }
      return data === true;
    },
    enabled: !!user?.id,
  });
};

// Get all users with their roles
export const useAllUsers = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .order("username");
      
      if (profilesError) throw profilesError;
      
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      
      if (rolesError) throw rolesError;
      
      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => ({
        ...profile,
        role: roles?.find(r => r.user_id === profile.id)?.role || "member",
      }));
      
      return usersWithRoles;
    },
    enabled: !!user?.id,
  });
};

// Get all bans
export const useBans = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["bans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_bans")
        .select("*")
        .order("banned_at", { ascending: false });
      
      if (error) throw error;
      
      // Get user details for each ban
      const userIds = [...new Set([
        ...(data || []).map(b => b.user_id),
        ...(data || []).map(b => b.banned_by),
      ])];
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", userIds);
      
      const bansWithUsers: UserBan[] = (data || []).map(ban => ({
        ...ban,
        user: profiles?.find(p => p.id === ban.user_id),
        banned_by_user: profiles?.find(p => p.id === ban.banned_by),
      }));
      
      return bansWithUsers;
    },
    enabled: !!user?.id,
  });
};

// Ban a user
export const useBanUser = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      reason, 
      isPermanent = false,
      expiresAt 
    }: { 
      userId: string; 
      reason?: string;
      isPermanent?: boolean;
      expiresAt?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("user_bans")
        .insert({
          user_id: userId,
          banned_by: user.id,
          reason,
          is_permanent: isPermanent,
          expires_at: expiresAt,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bans"] });
      toast({
        title: "Usuário banido",
        description: "O usuário foi banido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao banir",
        description: error.message,
      });
    },
  });
};

// Unban a user
export const useUnbanUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (banId: string) => {
      const { error } = await supabase
        .from("user_bans")
        .delete()
        .eq("id", banId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bans"] });
      toast({
        title: "Ban removido",
        description: "O usuário foi desbanido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao desbanir",
        description: error.message,
      });
    },
  });
};

// Set user role (owner only)
export const useSetUserRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // First, remove existing role
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      
      // Then add new role if not 'member'
      if (role !== "member") {
        const { error } = await supabase
          .from("user_roles")
          .insert({
            user_id: userId,
            role: role as "admin" | "moderator" | "member" | "owner",
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast({
        title: "Cargo atualizado",
        description: "O cargo do usuário foi atualizado.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar cargo",
        description: error.message,
      });
    },
  });
};
