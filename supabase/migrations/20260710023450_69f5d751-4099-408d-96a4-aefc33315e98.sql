DROP POLICY IF EXISTS "Agents can subscribe to agent_requests realtime" ON realtime.messages;

CREATE POLICY "Agents can subscribe to their own agent_requests realtime"
ON realtime.messages
FOR SELECT
USING (
  realtime.topic() = ('agent_requests:' || (
    SELECT ap.id::text FROM public.agent_profiles ap
    WHERE ap.user_id = auth.uid() AND ap.status = 'approved'
    LIMIT 1
  ))
);