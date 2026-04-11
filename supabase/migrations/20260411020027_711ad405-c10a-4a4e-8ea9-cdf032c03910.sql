
CREATE TABLE public.quote_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT '',
  address text DEFAULT '',
  message text DEFAULT '',
  photo_urls jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'new',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anon) to insert
CREATE POLICY "Anyone can submit quote requests"
  ON public.quote_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view
CREATE POLICY "Admins can view quote requests"
  ON public.quote_requests FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Only admins can update
CREATE POLICY "Admins can update quote requests"
  ON public.quote_requests FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can delete
CREATE POLICY "Admins can delete quote requests"
  ON public.quote_requests FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Auto-update timestamp
CREATE TRIGGER update_quote_requests_updated_at
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
