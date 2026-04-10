CREATE POLICY "Admin can update agent profiles"
ON public.agent_profiles
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));