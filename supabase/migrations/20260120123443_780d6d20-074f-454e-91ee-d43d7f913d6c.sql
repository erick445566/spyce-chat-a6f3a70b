-- Add unique constraint to username in profiles table
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);