-- Revoke direct EXECUTE on SECURITY DEFINER helper functions from public/anon/authenticated.
-- These are invoked internally (RLS evaluates them server-side, triggers/edge functions call them
-- with elevated context), so end-user clients have no need to call them directly.
DO $$
DECLARE
  fn text;
BEGIN
  FOR fn IN
    SELECT 'public.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')'
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proname IN (
        'generate_invoice_number',
        'generate_job_number',
        'generate_payslip_number',
        'update_updated_at_column',
        'handle_new_agent_signup',
        'notify_admin_on_activity',
        'enqueue_email',
        'read_email_batch',
        'delete_email',
        'move_to_dlq',
        'guard_agent_profile_update',
        'has_role',
        'is_admin',
        'is_admin_or_manager',
        'is_linked_employee'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
  END LOOP;
END $$;

-- Allow admins, managers, and webmasters to subscribe to realtime channels.
-- Underlying postgres_changes are still gated by table RLS, so non-staff cannot
-- read sensitive rows even if the channel were open.
DROP POLICY IF EXISTS "Staff can receive realtime broadcasts" ON realtime.messages;
CREATE POLICY "Staff can receive realtime broadcasts"
ON realtime.messages
FOR SELECT
TO authenticated
USING (public.is_admin_or_manager(auth.uid()));
