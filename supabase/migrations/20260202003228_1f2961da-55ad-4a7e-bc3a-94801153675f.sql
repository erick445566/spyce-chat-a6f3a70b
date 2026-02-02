-- Fix conversations INSERT RLS: ensure policy applies regardless of DB role while still requiring an authenticated user

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
TO public
WITH CHECK (
  auth.uid() IS NOT NULL
  AND created_by = auth.uid()
);
