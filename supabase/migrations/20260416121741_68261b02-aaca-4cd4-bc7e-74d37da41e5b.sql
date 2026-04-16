CREATE OR REPLACE FUNCTION public.notify_admin_on_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  payload jsonb;
BEGIN
  payload = jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'record', to_jsonb(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END
  );

  PERFORM net.http_post(
    url := 'https://pirmqgpibssmghgebupb.supabase.co/functions/v1/notify-admin-activity',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpcm1xZ3BpYnNzbWdoZ2VidXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMjg5ODgsImV4cCI6MjA5MDkwNDk4OH0._nZUfgcD1tIUdej2ECqCUnem7AaEuYnTMyNX_48OUn0'
    ),
    body := payload
  );

  RETURN NEW;
END;
$function$;