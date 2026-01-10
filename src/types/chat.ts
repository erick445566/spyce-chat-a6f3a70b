import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type ProfileInsert = TablesInsert<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;

export type Conversation = Tables<"conversations">;
export type ConversationInsert = TablesInsert<"conversations">;

export type ConversationParticipant = Tables<"conversation_participants">;
export type ConversationParticipantInsert = TablesInsert<"conversation_participants">;

export type Message = Tables<"messages">;
export type MessageInsert = TablesInsert<"messages">;
export type MessageUpdate = TablesUpdate<"messages">;

export type MessageRead = Tables<"message_reads">;
export type MessageReadInsert = TablesInsert<"message_reads">;

export interface ConversationWithDetails extends Conversation {
  participants: (ConversationParticipant & { profile: Profile })[];
  lastMessage?: Message;
  unreadCount?: number;
}

export interface MessageWithSender extends Message {
  sender: Profile | null;
  isRead?: boolean;
}
