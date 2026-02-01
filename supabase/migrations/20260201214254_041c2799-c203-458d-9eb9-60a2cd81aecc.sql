-- Create user_bans table for ban functionality
CREATE TABLE public.user_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  banned_by uuid NOT NULL REFERENCES public.profiles(id),
  reason text,
  banned_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  is_permanent boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

-- Only owners and admins can view bans
CREATE POLICY "Owners and admins can view bans"
ON public.user_bans
FOR SELECT
USING (
  public.is_owner(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin')
);

-- Only owners and admins can create bans
CREATE POLICY "Owners and admins can create bans"
ON public.user_bans
FOR INSERT
WITH CHECK (
  public.is_owner(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin')
);

-- Only owners can delete bans
CREATE POLICY "Owners can delete bans"
ON public.user_bans
FOR DELETE
USING (public.is_owner(auth.uid()));

-- Create statuses table for user status posts
CREATE TABLE public.statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text,
  media_url text,
  media_type text, -- 'image', 'video'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '24 hours'),
  view_count integer DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;

-- Users can view statuses from their contacts (simplified: all authenticated users)
CREATE POLICY "Users can view statuses"
ON public.statuses
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Users can create their own statuses
CREATE POLICY "Users can create their own statuses"
ON public.statuses
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can delete their own statuses
CREATE POLICY "Users can delete their own statuses"
ON public.statuses
FOR DELETE
USING (user_id = auth.uid());

-- Create status_views table
CREATE TABLE public.status_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status_id uuid NOT NULL REFERENCES public.statuses(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(status_id, viewer_id)
);

-- Enable RLS
ALTER TABLE public.status_views ENABLE ROW LEVEL SECURITY;

-- Status owners can see who viewed
CREATE POLICY "Status owners can view views"
ON public.status_views
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.statuses 
    WHERE statuses.id = status_views.status_id 
    AND statuses.user_id = auth.uid()
  )
);

-- Users can register their own views
CREATE POLICY "Users can register views"
ON public.status_views
FOR INSERT
WITH CHECK (viewer_id = auth.uid());

-- Create channels table (like Telegram channels - broadcast only)
CREATE TABLE public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar_url text,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_public boolean DEFAULT true,
  invite_code text DEFAULT public.generate_invite_code(),
  subscriber_count integer DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Anyone can view public channels
CREATE POLICY "Anyone can view public channels"
ON public.channels
FOR SELECT
USING (is_public = true OR created_by = auth.uid());

-- Only owners/admins can create channels
CREATE POLICY "Owners and admins can create channels"
ON public.channels
FOR INSERT
WITH CHECK (
  public.is_owner(auth.uid()) OR 
  public.has_role(auth.uid(), 'admin')
);

-- Channel owners can update
CREATE POLICY "Channel owners can update"
ON public.channels
FOR UPDATE
USING (created_by = auth.uid());

-- Channel owners can delete
CREATE POLICY "Channel owners can delete"
ON public.channels
FOR DELETE
USING (created_by = auth.uid());

-- Create channel_subscribers table
CREATE TABLE public.channel_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscribed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

-- Enable RLS
ALTER TABLE public.channel_subscribers ENABLE ROW LEVEL SECURITY;

-- Subscribers can view their subscriptions
CREATE POLICY "Users can view subscriptions"
ON public.channel_subscribers
FOR SELECT
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.channels WHERE channels.id = channel_subscribers.channel_id AND channels.created_by = auth.uid()
));

-- Users can subscribe to public channels
CREATE POLICY "Users can subscribe"
ON public.channel_subscribers
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can unsubscribe
CREATE POLICY "Users can unsubscribe"
ON public.channel_subscribers
FOR DELETE
USING (user_id = auth.uid());

-- Create channel_messages table
CREATE TABLE public.channel_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  content text,
  media_url text,
  media_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  view_count integer DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;

-- Subscribers can view messages
CREATE POLICY "Subscribers can view messages"
ON public.channel_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.channel_subscribers 
    WHERE channel_subscribers.channel_id = channel_messages.channel_id 
    AND channel_subscribers.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.channels 
    WHERE channels.id = channel_messages.channel_id 
    AND channels.created_by = auth.uid()
  )
);

-- Only channel owners can post messages
CREATE POLICY "Channel owners can post"
ON public.channel_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.channels 
    WHERE channels.id = channel_messages.channel_id 
    AND channels.created_by = auth.uid()
  )
);

-- Channel owners can delete messages
CREATE POLICY "Channel owners can delete messages"
ON public.channel_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.channels 
    WHERE channels.id = channel_messages.channel_id 
    AND channels.created_by = auth.uid()
  )
);