
CREATE OR REPLACE FUNCTION public.generate_job_number()
RETURNS text
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 'MGS-' || LPAD(nextval('public.job_number_seq')::text, 3, '0');
$$;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 'INV-' || LPAD(nextval('public.invoice_number_seq')::text, 3, '0');
$$;
