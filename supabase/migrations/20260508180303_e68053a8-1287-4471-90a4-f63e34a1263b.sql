-- 1) Drop orphan anonymous storage upload policy (path no longer used by app)
DROP POLICY IF EXISTS "Anyone can upload to quote-requests prefix" ON storage.objects;

-- 2) Tighten linked-employee read access to clients (scope to same owner)
DROP POLICY IF EXISTS "Linked employees can view assigned clients" ON public.clients;
CREATE POLICY "Linked employees can view assigned clients"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1
    FROM public.jobs j
    JOIN public.job_employees je ON je.job_id = j.id
    JOIN public.employees e ON e.id = je.employee_id
    WHERE j.client_id = clients.id
      AND e.linked_user_id = auth.uid()
      AND j.user_id = clients.user_id
      AND je.user_id = clients.user_id
      AND e.user_id = clients.user_id
  ));

-- 3) Use the service-role key (not the public anon key) when the DB webhook
--    calls the notify-admin-activity edge function. The edge function will
--    additionally validate this on its side.
CREATE OR REPLACE FUNCTION public.notify_admin_on_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  payload jsonb;
  service_key text;
BEGIN
  payload = jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', to_jsonb(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END
  );

  -- Read the service role key from the vault (set by setup_email_infra)
  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'email_queue_service_role_key'
  LIMIT 1;

  IF service_key IS NULL THEN
    RAISE LOG 'notify_admin_on_activity: service role key not found in vault, skipping';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://pirmqgpibssmghgebupb.supabase.co/functions/v1/notify-admin-activity',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := payload
  );

  RETURN NEW;
END;
$function$;