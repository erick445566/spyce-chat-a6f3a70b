-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can see other participants in their conversations" ON public.conversation_participants;

-- Create a new non-recursive policy using the security definer function
CREATE POLICY "Users can see other participants in their conversations"
ON public.conversation_participants
FOR SELECT
USING (
  public.user_is_participant(conversation_id, auth.uid())
);