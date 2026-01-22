-- Add invite_code column to communities
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- Add invite_code column to conversations (for group invites)
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- Create function to generate random invite codes
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Create function to join a community via invite code
CREATE OR REPLACE FUNCTION public.join_community_by_invite(p_invite_code TEXT)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_community_id uuid;
  v_user_id uuid := auth.uid();
BEGIN
  -- Find community by invite code
  SELECT id INTO v_community_id 
  FROM communities 
  WHERE invite_code = p_invite_code;
  
  IF v_community_id IS NULL THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;
  
  -- Check if user is already a member
  IF EXISTS (SELECT 1 FROM community_members WHERE community_id = v_community_id AND user_id = v_user_id) THEN
    RETURN v_community_id; -- Already a member, just return the id
  END IF;
  
  -- Add user as member
  INSERT INTO community_members (community_id, user_id, role)
  VALUES (v_community_id, v_user_id, 'member');
  
  RETURN v_community_id;
END;
$$;

-- Create function to join a group via invite code
CREATE OR REPLACE FUNCTION public.join_group_by_invite(p_invite_code TEXT)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id uuid;
  v_user_id uuid := auth.uid();
BEGIN
  -- Find group by invite code
  SELECT id INTO v_conversation_id 
  FROM conversations 
  WHERE invite_code = p_invite_code AND is_group = true;
  
  IF v_conversation_id IS NULL THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;
  
  -- Check if user is already a participant
  IF EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = v_conversation_id AND user_id = v_user_id) THEN
    RETURN v_conversation_id; -- Already a participant, just return the id
  END IF;
  
  -- Add user as participant
  INSERT INTO conversation_participants (conversation_id, user_id, role)
  VALUES (v_conversation_id, v_user_id, 'member');
  
  RETURN v_conversation_id;
END;
$$;