-- Create function to check if user is owner
CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'owner'
  );
$$;

-- Create function to check if user has role (including owner check)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Allow owners to manage user_roles
CREATE POLICY "Owners can manage user_roles"
ON public.user_roles
FOR ALL
USING (public.is_owner(auth.uid()))
WITH CHECK (public.is_owner(auth.uid()));

-- Allow users to view all user_roles (needed for permission checks)
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view all roles"
ON public.user_roles
FOR SELECT
USING (true);