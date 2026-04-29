
-- 1) Lock down email_unsubscribe_tokens with explicit deny for non-service roles
CREATE POLICY "Deny anon and authenticated access to unsubscribe tokens"
ON public.email_unsubscribe_tokens
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- 2) Restrict Supabase Realtime subscriptions: deny by default for anon/authenticated.
-- Postgres_changes still respects per-table RLS, so legitimate authorized data flows
-- continue to work because the changefeed is filtered on the server side.
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny realtime channel access by default" ON realtime.messages;
CREATE POLICY "Deny realtime channel access by default"
ON realtime.messages
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- 3) Revoke EXECUTE on SECURITY DEFINER functions that should never be invoked
-- directly via the public API. Service role bypasses these grants, and RLS
-- policies that call these helpers continue to work because policy evaluation
-- runs as the function owner, not the caller.
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_admin_on_activity() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_agent_signup() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_invoice_number() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_job_number() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.generate_payslip_number() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_manager(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_linked_employee(uuid) FROM anon, authenticated, public;
