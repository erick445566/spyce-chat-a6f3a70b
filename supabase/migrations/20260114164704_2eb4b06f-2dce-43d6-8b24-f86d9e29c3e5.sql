-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'member');

-- Create enum for conversation types
CREATE TYPE public.conversation_type AS ENUM ('private', 'group', 'community');

-- Create communities table
CREATE TABLE public.communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    is_public BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on communities
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- Create community members table
CREATE TABLE public.community_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'member',
    is_muted BOOLEAN DEFAULT false,
    muted_until TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(community_id, user_id)
);

-- Enable RLS on community_members
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Create user_roles table for global roles (security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Add conversation_type column to conversations
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS conversation_type TEXT DEFAULT 'private';
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL;

-- Add muted_until column to conversation_participants
ALTER TABLE public.conversation_participants ADD COLUMN IF NOT EXISTS muted_until TIMESTAMP WITH TIME ZONE;

-- Security definer function to check participant role
CREATE OR REPLACE FUNCTION public.get_participant_role(_user_id UUID, _conversation_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.conversation_participants 
    WHERE user_id = _user_id AND conversation_id = _conversation_id
    LIMIT 1;
$$;

-- Security definer function to check community role
CREATE OR REPLACE FUNCTION public.get_community_role(_user_id UUID, _community_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.community_members 
    WHERE user_id = _user_id AND community_id = _community_id
    LIMIT 1;
$$;

-- Security definer function to check if user is participant
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id UUID, _conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.conversation_participants 
        WHERE user_id = _user_id AND conversation_id = _conversation_id
    );
$$;

-- Security definer function to check if user is community member
CREATE OR REPLACE FUNCTION public.is_community_member(_user_id UUID, _community_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.community_members 
        WHERE user_id = _user_id AND community_id = _community_id
    );
$$;

-- RLS Policies for communities
CREATE POLICY "Anyone can view public communities"
ON public.communities FOR SELECT
USING (is_public = true OR public.is_community_member(auth.uid(), id));

CREATE POLICY "Users can create communities"
ON public.communities FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update their communities"
ON public.communities FOR UPDATE
USING (public.get_community_role(auth.uid(), id) = 'admin');

CREATE POLICY "Admins can delete their communities"
ON public.communities FOR DELETE
USING (public.get_community_role(auth.uid(), id) = 'admin');

-- RLS Policies for community_members
CREATE POLICY "Members can view other members"
ON public.community_members FOR SELECT
USING (public.is_community_member(auth.uid(), community_id));

CREATE POLICY "Users can join public communities"
ON public.community_members FOR INSERT
WITH CHECK (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM public.communities WHERE id = community_id AND is_public = true)
);

CREATE POLICY "Admins can add members"
ON public.community_members FOR INSERT
WITH CHECK (public.get_community_role(auth.uid(), community_id) IN ('admin', 'moderator'));

CREATE POLICY "Admins can update members"
ON public.community_members FOR UPDATE
USING (public.get_community_role(auth.uid(), community_id) IN ('admin', 'moderator'));

CREATE POLICY "Admins can remove members"
ON public.community_members FOR DELETE
USING (public.get_community_role(auth.uid(), community_id) IN ('admin', 'moderator') OR user_id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

-- Update conversation_participants policies to allow admin actions
DROP POLICY IF EXISTS "Admins can manage participants" ON public.conversation_participants;

CREATE POLICY "Admins can manage participants"
ON public.conversation_participants FOR DELETE
USING (
    public.get_participant_role(auth.uid(), conversation_id) = 'admin'
    OR user_id = auth.uid()
);

CREATE POLICY "Admins can update participants"
ON public.conversation_participants FOR UPDATE
USING (public.get_participant_role(auth.uid(), conversation_id) IN ('admin', 'moderator'));

CREATE POLICY "Admins can add participants to groups"
ON public.conversation_participants FOR INSERT
WITH CHECK (
    user_id = auth.uid() 
    OR public.get_participant_role(auth.uid(), conversation_id) IN ('admin', 'moderator')
);

-- Triggers for communities
CREATE TRIGGER update_communities_updated_at
BEFORE UPDATE ON public.communities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add realtime for communities
ALTER PUBLICATION supabase_realtime ADD TABLE public.communities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_members;