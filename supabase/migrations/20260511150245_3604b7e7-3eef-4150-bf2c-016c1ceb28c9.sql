
-- Strengthen agent_profiles self-update policy with explicit column-restricted WITH CHECK
-- (defense in depth alongside guard_agent_profile_update_trg trigger)
DROP POLICY IF EXISTS "Agents can update own profile" ON public.agent_profiles;

CREATE POLICY "Agents can update own profile contact fields"
ON public.agent_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND status = (SELECT status FROM public.agent_profiles WHERE id = agent_profiles.id)
  AND commission_rate = (SELECT commission_rate FROM public.agent_profiles WHERE id = agent_profiles.id)
  AND commission_enabled = (SELECT commission_enabled FROM public.agent_profiles WHERE id = agent_profiles.id)
  AND referral_code = (SELECT referral_code FROM public.agent_profiles WHERE id = agent_profiles.id)
  AND user_id = (SELECT user_id FROM public.agent_profiles WHERE id = agent_profiles.id)
);

-- Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated.
-- These should only be called by service_role (edge functions / triggers).
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_admin_on_activity() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_agent_signup() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.guard_agent_profile_update() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_invoice_number() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_job_number() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_payslip_number() FROM anon, authenticated, public;
