import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";

    // Verify the caller is an authenticated admin or webmaster.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await userClient.rpc("is_admin", { _user_id: userData.user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const start: string | null = body.start ?? null;
    const end: string | null = body.end ?? null;
    const template: string | null = body.template ?? null;
    const status: string | null = body.status ?? null;
    const limit: number = Math.min(Math.max(Number(body.limit ?? 100), 1), 500);

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Fetch a generous window of rows ordered desc; dedupe client-side by message_id.
    let query = admin
      .from("email_send_log")
      .select("id, message_id, template_name, recipient_email, status, error_message, created_at")
      .order("created_at", { ascending: false })
      .limit(2000);

    if (start) query = query.gte("created_at", start);
    if (end) query = query.lte("created_at", end);
    if (template) query = query.eq("template_name", template);

    const { data, error } = await query;
    if (error) throw error;

    // Deduplicate by message_id, keeping the latest row.
    const seen = new Set<string>();
    const dedup: typeof data = [];
    for (const row of data ?? []) {
      const key = row.message_id ?? row.id;
      if (seen.has(key)) continue;
      seen.add(key);
      dedup.push(row);
    }

    const filtered = status ? dedup.filter((r) => r.status === status) : dedup;
    const rows = filtered.slice(0, limit);

    const stats = {
      total: filtered.length,
      sent: filtered.filter((r) => r.status === "sent").length,
      failed: filtered.filter((r) => r.status === "dlq" || r.status === "failed" || r.status === "bounced").length,
      suppressed: filtered.filter((r) => r.status === "suppressed" || r.status === "complained").length,
      pending: filtered.filter((r) => r.status === "pending").length,
    };

    // Distinct templates for filter dropdown (from the un-status-filtered window).
    const templates = Array.from(new Set(dedup.map((r) => r.template_name).filter(Boolean))).sort();

    return new Response(JSON.stringify({ rows, stats, templates }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
