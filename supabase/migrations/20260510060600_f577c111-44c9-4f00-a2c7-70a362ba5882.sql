-- Restore EXECUTE on role-check helpers used inside RLS policies.
-- They are SECURITY DEFINER and only return booleans, safe for authenticated callers.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_or_manager(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_linked_employee(uuid) TO authenticated;
