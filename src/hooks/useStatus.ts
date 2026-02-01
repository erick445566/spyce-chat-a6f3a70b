import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Status {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  expires_at: string;
  view_count: number;
  user?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface StatusView {
  id: string;
  status_id: string;
  viewer_id: string;
  viewed_at: string;
  viewer?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

// Get all active statuses (not expired)
export const useStatuses = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["statuses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("statuses")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Get user profiles
      const userIds = [...new Set((data || []).map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", userIds);
      
      const statusesWithUsers: Status[] = (data || []).map(status => ({
        ...status,
        user: profiles?.find(p => p.id === status.user_id),
      }));
      
      return statusesWithUsers;
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refresh every minute
  });
};

// Get my statuses
export const useMyStatuses = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["myStatuses", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("statuses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Status[];
    },
    enabled: !!user?.id,
  });
};

// Get views for a status
export const useStatusViews = (statusId: string | null) => {
  return useQuery({
    queryKey: ["statusViews", statusId],
    queryFn: async () => {
      if (!statusId) return [];
      
      const { data, error } = await supabase
        .from("status_views")
        .select("*")
        .eq("status_id", statusId)
        .order("viewed_at", { ascending: false });
      
      if (error) throw error;
      
      // Get viewer profiles
      const viewerIds = (data || []).map(v => v.viewer_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", viewerIds);
      
      const viewsWithUsers: StatusView[] = (data || []).map(view => ({
        ...view,
        viewer: profiles?.find(p => p.id === view.viewer_id),
      }));
      
      return viewsWithUsers;
    },
    enabled: !!statusId,
  });
};

// Create a status
export const useCreateStatus = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      content, 
      mediaUrl, 
      mediaType 
    }: { 
      content?: string; 
      mediaUrl?: string;
      mediaType?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("statuses")
        .insert({
          user_id: user.id,
          content,
          media_url: mediaUrl,
          media_type: mediaType,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
      queryClient.invalidateQueries({ queryKey: ["myStatuses"] });
      toast({
        title: "Status publicado!",
        description: "Seu status será visível por 24 horas.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao publicar status",
        description: error.message,
      });
    },
  });
};

// Delete a status
export const useDeleteStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (statusId: string) => {
      const { error } = await supabase
        .from("statuses")
        .delete()
        .eq("id", statusId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
      queryClient.invalidateQueries({ queryKey: ["myStatuses"] });
      toast({
        title: "Status removido",
      });
    },
  });
};

// Mark status as viewed
export const useViewStatus = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (statusId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("status_views")
        .upsert({
          status_id: statusId,
          viewer_id: user.id,
        }, {
          onConflict: "status_id,viewer_id",
        });
      
      if (error && !error.message.includes("duplicate")) {
        throw error;
      }
    },
    onSuccess: (_, statusId) => {
      queryClient.invalidateQueries({ queryKey: ["statusViews", statusId] });
    },
  });
};
