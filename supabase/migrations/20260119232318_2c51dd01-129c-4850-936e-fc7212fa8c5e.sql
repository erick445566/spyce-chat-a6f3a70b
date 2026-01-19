-- Create avatars bucket for profile pictures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create chat-images bucket for message images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Add theme columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS theme_primary_color TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN DEFAULT false;

-- Add theme columns to conversations
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT NULL;

-- Add theme columns to communities
ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT NULL;

-- Storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for chat-images bucket
CREATE POLICY "Chat images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'chat-images');

CREATE POLICY "Authenticated users can upload chat images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'chat-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own chat images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);