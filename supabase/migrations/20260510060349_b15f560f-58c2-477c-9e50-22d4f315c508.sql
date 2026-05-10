-- Allow approved agents to subscribe to the agent_requests realtime topic.
-- Underlying agent_requests RLS still gates which rows they can see.
DROP POLICY IF EXISTS "Agents can subscribe to agent_requests realtime" ON realtime.messages;

CREATE POLICY "Agents can subscribe to agent_requests realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'agent_requests'
  AND EXISTS (
    SELECT 1 FROM public.agent_profiles ap
    WHERE ap.user_id = auth.uid()
      AND ap.status = 'approved'
  )
);
