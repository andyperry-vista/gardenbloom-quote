
-- Fix search path on update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Create a security definer function to check if user is admin (not an agent)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.agent_profiles WHERE user_id = _user_id
  );
$$;

-- Fix overly permissive policies on agent_requests
DROP POLICY IF EXISTS "Admin can view all requests" ON public.agent_requests;
CREATE POLICY "Admin can view all requests"
  ON public.agent_requests FOR SELECT
  TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR agent_id IN (SELECT id FROM public.agent_profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admin can update requests" ON public.agent_requests;
CREATE POLICY "Admin can update requests"
  ON public.agent_requests FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Fix overly permissive policies on agent_referrals
DROP POLICY IF EXISTS "Admin can manage all referrals" ON public.agent_referrals;
CREATE POLICY "Admin can manage referrals"
  ON public.agent_referrals FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
