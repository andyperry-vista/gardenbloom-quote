-- Add a restrictive INSERT policy that blocks non-admin users from inserting roles
-- This ensures only existing admins can grant roles, preventing privilege escalation
CREATE POLICY "Non-admins cannot insert roles"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
