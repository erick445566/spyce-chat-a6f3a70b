import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: "user" | "support" | "ai";
  content: string;
  created_at: string;
}

export const useSupportTickets = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["support-tickets", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as SupportTicket[];
    },
    enabled: !!user?.id,
  });
};

export const useTicketMessages = (ticketId: string | null) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["ticket-messages", ticketId],
    queryFn: async () => {
      if (!ticketId) return [];

      const { data, error } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as TicketMessage[];
    },
    enabled: !!ticketId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!ticketId) return;

    const channel = supabase
      .channel(`ticket-messages-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ticket_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ticket-messages", ticketId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, queryClient]);

  return query;
};

export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      subject,
      initialMessage,
    }: {
      subject: string;
      initialMessage: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .insert({ user_id: user.id, subject })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Add initial message
      const { error: messageError } = await supabase
        .from("ticket_messages")
        .insert({
          ticket_id: ticket.id,
          sender_type: "user",
          content: initialMessage,
        });

      if (messageError) throw messageError;

      return ticket as SupportTicket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });
};

export const useSendTicketMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      content,
      senderType = "user",
    }: {
      ticketId: string;
      content: string;
      senderType?: "user" | "support" | "ai";
    }) => {
      const { data, error } = await supabase
        .from("ticket_messages")
        .insert({
          ticket_id: ticketId,
          sender_type: senderType,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TicketMessage;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-messages", variables.ticketId],
      });
    },
  });
};

export const useAISupport = () => {
  return useMutation({
    mutationFn: async ({
      messages,
      ticketSubject,
    }: {
      messages: { role: "user" | "assistant"; content: string }[];
      ticketSubject?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("ai-support", {
        body: { messages, ticketSubject },
      });

      if (error) throw error;
      return data.message as string;
    },
  });
};

export const useCloseTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status: "closed" })
        .eq("id", ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });
};