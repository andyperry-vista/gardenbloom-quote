-- Fix broken self-referential subqueries in agent_profiles update policy.
-- Previous WITH CHECK used agent_profiles_1.id = agent_profiles_1.id (always true),
-- which made the field-freeze checks ineffective.
DROP POLICY IF EXISTS "Agents can update own profile contact fields" ON public.agent_profiles;

CREATE POLICY "Agents can update own profile contact fields"
ON public.agent_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND status = (SELECT ap.status FROM public.agent_profiles ap WHERE ap.id = agent_profiles.id)
  AND commission_rate = (SELECT ap.commission_rate FROM public.agent_profiles ap WHERE ap.id = agent_profiles.id)
  AND commission_enabled = (SELECT ap.commission_enabled FROM public.agent_profiles ap WHERE ap.id = agent_profiles.id)
  AND referral_code = (SELECT ap.referral_code FROM public.agent_profiles ap WHERE ap.id = agent_profiles.id)
  AND user_id = (SELECT ap.user_id FROM public.agent_profiles ap WHERE ap.id = agent_profiles.id)
);
