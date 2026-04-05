
INSERT INTO storage.buckets (id, name, public) VALUES ('garden-photos', 'garden-photos', true);

CREATE POLICY "Anyone can upload garden photos" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'garden-photos');

CREATE POLICY "Anyone can view garden photos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'garden-photos');
