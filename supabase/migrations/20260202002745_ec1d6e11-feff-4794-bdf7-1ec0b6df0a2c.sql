-- Fix conversation creation: allow creator to insert participant rows for other users without violating RLS

-- 1) Helper function: check whether user created the conversation (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_conversation_creator(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = _conversation_id
      AND c.created_by = _user_id
  );
$$;

-- 2) Replace INSERT policies on conversation_participants
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Admins can add participants to groups" ON public.conversation_participants;

CREATE POLICY "Users can insert conversation participants"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  -- user can always insert their own participant row
  user_id = auth.uid()
  OR
  -- conversation creator can insert rows for other users (covers initial private chat creation)
  public.is_conversation_creator(auth.uid(), conversation_id)
  OR
  -- existing admins/moderators can add participants later
  get_participant_role(auth.uid(), conversation_id) = ANY (ARRAY['admin'::text, 'moderator'::text])
);
