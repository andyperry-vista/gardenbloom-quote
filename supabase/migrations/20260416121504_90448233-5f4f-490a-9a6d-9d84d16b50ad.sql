-- Drop the broken triggers that rely on vault secrets that aren't accessible
DROP TRIGGER IF EXISTS on_job_change ON public.jobs;
DROP TRIGGER IF EXISTS on_new_quote_request ON public.quote_requests;

-- Recreate the function to gracefully handle missing vault secrets
CREATE OR REPLACE FUNCTION public.notify_admin_on_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  payload jsonb;
  supabase_url text;
  service_key text;
BEGIN
  BEGIN
    SELECT decrypted_secret INTO supabase_url FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL' LIMIT 1;
    SELECT decrypted_secret INTO service_key FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
  END;

  IF supabase_url IS NULL OR service_key IS NULL THEN
    RETURN NEW;
  END IF;

  payload = jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', to_jsonb(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END
  );

  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/notify-admin-activity',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := payload
  );

  RETURN NEW;
END;
$function$;

-- Recreate triggers
CREATE TRIGGER on_job_change
  AFTER INSERT OR UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_activity();

CREATE TRIGGER on_new_quote_request
  AFTER INSERT OR UPDATE ON public.quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_activity();