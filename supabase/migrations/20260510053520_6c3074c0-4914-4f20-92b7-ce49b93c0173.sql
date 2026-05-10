DROP POLICY IF EXISTS "Staff can receive realtime broadcasts" ON realtime.messages;
DROP POLICY IF EXISTS "Admins can receive realtime broadcasts" ON realtime.messages;

CREATE POLICY "Admins can receive realtime broadcasts"
ON realtime.messages
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));