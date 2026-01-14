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

export type Community = Tables<"communities">;
export type CommunityInsert = TablesInsert<"communities">;
export type CommunityUpdate = TablesUpdate<"communities">;

export type CommunityMember = Tables<"community_members">;
export type CommunityMemberInsert = TablesInsert<"community_members">;

export type AppRole = 'admin' | 'moderator' | 'member';

export interface ConversationWithDetails extends Conversation {
  participants: (ConversationParticipant & { profile: Profile })[];
  lastMessage?: Message;
  unreadCount?: number;
}

export interface CommunityWithDetails extends Community {
  members: (CommunityMember & { profile: Profile })[];
  memberCount?: number;
}

export interface MessageWithSender extends Message {
  sender: Profile | null;
  isRead?: boolean;
}
