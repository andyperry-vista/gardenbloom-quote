-- Fix 1: Restrict service_packages SELECT to owner only (remove cross-tenant exposure)
DROP POLICY IF EXISTS "Anyone can read active packages" ON public.service_packages;

-- Fix 2: Tighten garden-photos storage policies
-- Remove existing permissive INSERT policy and add owner-scoped policies
DROP POLICY IF EXISTS "Authenticated users can upload garden photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload garden photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload garden photos" ON storage.objects;

-- Allow authenticated users to upload only into a folder matching their auth.uid()
CREATE POLICY "Users can upload own garden photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'garden-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update only their own files
CREATE POLICY "Users can update own garden photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'garden-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'garden-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete only their own files
CREATE POLICY "Users can delete own garden photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'garden-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Also allow anonymous quote-request uploads into a public 'quote-requests/' prefix
-- (since quote_requests can be submitted by anon users)
CREATE POLICY "Anyone can upload to quote-requests prefix"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'garden-photos'
  AND (storage.foldername(name))[1] = 'quote-requests'
);