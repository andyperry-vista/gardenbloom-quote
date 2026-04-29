-- Restore EXECUTE on role-check helpers used inside RLS policies.
-- These are SECURITY DEFINER (safe) but callers still need EXECUTE to evaluate policies.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_or_manager(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_linked_employee(uuid) TO authenticated;