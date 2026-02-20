
-- Table for bot API tokens (external bots)
CREATE TABLE public.bot_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Meu Bot',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  pairing_code text UNIQUE DEFAULT upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8)),
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.bot_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tokens"
ON public.bot_tokens FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create tokens"
ON public.bot_tokens FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own tokens"
ON public.bot_tokens FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own tokens"
ON public.bot_tokens FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Table for internal auto-reply bot rules
CREATE TABLE public.bot_auto_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_keyword text NOT NULL,
  response_text text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  match_type text NOT NULL DEFAULT 'contains' CHECK (match_type IN ('exact', 'contains', 'starts_with')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bot_auto_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own auto replies"
ON public.bot_auto_replies FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create auto replies"
ON public.bot_auto_replies FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own auto replies"
ON public.bot_auto_replies FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own auto replies"
ON public.bot_auto_replies FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_bot_auto_replies_updated_at
BEFORE UPDATE ON public.bot_auto_replies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
