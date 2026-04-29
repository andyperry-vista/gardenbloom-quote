// Renders a single transactional email template with caller-supplied templateData.
// Used by the in-app email preview UI in the quote flow.
//
// Auth: standard verify_jwt=true (default). We additionally verify the caller
// is an admin via the is_admin RPC before rendering.

import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !anonKey) return json({ error: 'Server misconfigured' }, 500)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  // Use the caller's JWT so RLS / auth.uid() reflect the requesting user.
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData?.user) return json({ error: 'Unauthorized' }, 401)

  const { data: isAdmin, error: roleErr } = await supabase.rpc('is_admin', {
    _user_id: userData.user.id,
  })
  if (roleErr) return json({ error: 'Role check failed' }, 500)
  if (!isAdmin) return json({ error: 'Forbidden' }, 403)

  let body: { templateName?: string; templateData?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const templateName = typeof body.templateName === 'string' ? body.templateName : ''
  const templateData = (body.templateData && typeof body.templateData === 'object')
    ? body.templateData
    : {}

  const entry = TEMPLATES[templateName]
  if (!entry) {
    return json({ error: `Unknown template: ${templateName}` }, 400)
  }

  try {
    const html = await renderAsync(React.createElement(entry.component, templateData))
    const subject = typeof entry.subject === 'function'
      ? entry.subject(templateData)
      : entry.subject
    return json({ templateName, subject, html })
  } catch (err) {
    console.error('render-quote-email render failure', err)
    return json({
      error: 'Render failed',
      message: err instanceof Error ? err.message : String(err),
    }, 500)
  }
})
