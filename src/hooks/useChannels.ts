import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  invite_code: string | null;
  subscriber_count: number;
  isSubscribed?: boolean;
  isOwner?: boolean;
}

export interface ChannelMessage {
  id: string;
  channel_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  view_count: number;
}

// Get all public channels
export const useChannels = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["channels", user?.id],
    queryFn: async () => {
      const { data: channels, error } = await supabase
        .from("channels")
        .select("*")
        .order("subscriber_count", { ascending: false });
      
      if (error) throw error;
      
      // Get user's subscriptions
      let subscriptions: string[] = [];
      if (user?.id) {
        const { data: subs } = await supabase
          .from("channel_subscribers")
          .select("channel_id")
          .eq("user_id", user.id);
        subscriptions = (subs || []).map(s => s.channel_id);
      }
      
      const channelsWithStatus: Channel[] = (channels || []).map(channel => ({
        ...channel,
        isSubscribed: subscriptions.includes(channel.id),
        isOwner: channel.created_by === user?.id,
      }));
      
      return channelsWithStatus;
    },
    enabled: !!user?.id,
  });
};

// Get my channels (owned)
export const useMyChannels = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["myChannels", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Channel[];
    },
    enabled: !!user?.id,
  });
};

// Get channel messages
export const useChannelMessages = (channelId: string | null) => {
  return useQuery({
    queryKey: ["channelMessages", channelId],
    queryFn: async () => {
      if (!channelId) return [];
      
      const { data, error } = await supabase
        .from("channel_messages")
        .select("*")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as ChannelMessage[];
    },
    enabled: !!channelId,
  });
};

// Create a channel
export const useCreateChannel = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      name, 
      description,
      isPublic = true
    }: { 
      name: string; 
      description?: string;
      isPublic?: boolean;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("channels")
        .insert({
          name,
          description,
          created_by: user.id,
          is_public: isPublic,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Auto-subscribe creator
      await supabase
        .from("channel_subscribers")
        .insert({
          channel_id: data.id,
          user_id: user.id,
        });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      queryClient.invalidateQueries({ queryKey: ["myChannels"] });
      toast({
        title: "Canal criado!",
        description: "Seu canal está pronto para receber publicações.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar canal",
        description: error.message,
      });
    },
  });
};

// Subscribe to channel
export const useSubscribeChannel = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (channelId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("channel_subscribers")
        .insert({
          channel_id: channelId,
          user_id: user.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      toast({
        title: "Inscrito!",
        description: "Você receberá as atualizações deste canal.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao se inscrever",
        description: error.message,
      });
    },
  });
};

// Unsubscribe from channel
export const useUnsubscribeChannel = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (channelId: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("channel_subscribers")
        .delete()
        .eq("channel_id", channelId)
        .eq("user_id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      toast({
        title: "Inscrição cancelada",
      });
    },
  });
};

// Post message to channel
export const usePostChannelMessage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      channelId, 
      content,
      mediaUrl,
      mediaType
    }: { 
      channelId: string; 
      content?: string;
      mediaUrl?: string;
      mediaType?: string;
    }) => {
      const { data, error } = await supabase
        .from("channel_messages")
        .insert({
          channel_id: channelId,
          content,
          media_url: mediaUrl,
          media_type: mediaType,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["channelMessages", variables.channelId] });
      toast({
        title: "Mensagem publicada!",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao publicar",
        description: error.message,
      });
    },
  });
};

// Delete channel
export const useDeleteChannel = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (channelId: string) => {
      const { error } = await supabase
        .from("channels")
        .delete()
        .eq("id", channelId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
      queryClient.invalidateQueries({ queryKey: ["myChannels"] });
      toast({
        title: "Canal excluído",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir canal",
        description: error.message,
      });
    },
  });
};
