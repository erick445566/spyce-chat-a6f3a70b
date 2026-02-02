-- First, create the security definer function to check if user is in a conversation
-- This avoids infinite recursion by bypassing RLS
CREATE OR REPLACE FUNCTION public.user_is_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = _conversation_id
    AND user_id = _user_id
  );
$$;