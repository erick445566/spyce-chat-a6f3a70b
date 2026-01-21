-- Add UPDATE policy for conversations (admins can update their groups/conversations)
CREATE POLICY "Admins can update conversations"
ON public.conversations
FOR UPDATE
USING (
  get_participant_role(auth.uid(), id) = 'admin'
);

-- Add DELETE policy for conversations
CREATE POLICY "Admins can delete conversations"
ON public.conversations
FOR DELETE
USING (
  get_participant_role(auth.uid(), id) = 'admin'
);

-- Create a function to count community groups (bypasses RLS)
CREATE OR REPLACE FUNCTION public.count_community_groups(p_community_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer 
  FROM conversations 
  WHERE community_id = p_community_id 
  AND conversation_type = 'community';
$$;