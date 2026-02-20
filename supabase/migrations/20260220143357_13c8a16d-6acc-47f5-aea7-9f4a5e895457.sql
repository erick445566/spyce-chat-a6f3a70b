-- Fix: Allow conversation creators to SELECT their own conversations
-- This is needed because .insert().select() requires the SELECT policy to pass
-- and at insert time, no participants have been added yet

DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;

CREATE POLICY "Users can view their conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
  OR id IN (
    SELECT conversation_id FROM public.conversation_participants
    WHERE user_id = auth.uid()
  )
);