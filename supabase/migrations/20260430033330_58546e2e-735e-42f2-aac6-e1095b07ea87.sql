
-- 1. Drop overly permissive storage upload policy
DROP POLICY IF EXISTS "Authenticated users can upload to garden-photos" ON storage.objects;

-- 2. Lock down SECURITY DEFINER functions
-- RLS helpers: needed by authenticated, NOT by anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_manager(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_linked_employee(uuid) FROM PUBLIC;

-- Internal/service-only helpers: revoke from everyone except service_role
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_invoice_number() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_job_number() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_payslip_number() FROM PUBLIC, anon;
