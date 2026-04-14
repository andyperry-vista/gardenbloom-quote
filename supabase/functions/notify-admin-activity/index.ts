import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, table, record, old_record } = await req.json();

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    webpush.setVapidDetails(
      "mailto:admin@mayuragardenservices.com.au",
      vapidPublicKey,
      vapidPrivateKey
    );

    let title = "Mayura Garden Services";
    let body = "Something happened";
    let url = "/admin";
    let tag = "activity";

    if (table === "quote_requests" && type === "INSERT") {
      title = "🌿 New Quote Request";
      body = `${record.name} has requested a quote`;
      url = "/admin/quote-requests";
      tag = "quote-request";
    } else if (table === "jobs" && type === "UPDATE") {
      const statusLabel = record.status?.replace(/_/g, " ") || "updated";
      title = "🔧 Job Updated";
      body = `Job ${record.job_number} is now ${statusLabel}`;
      url = `/admin/jobs/${record.id}`;
      tag = `job-${record.id}`;
    } else if (table === "jobs" && type === "INSERT") {
      title = "📋 New Job Created";
      body = `Job ${record.job_number} has been created`;
      url = `/admin/jobs/${record.id}`;
      tag = `job-${record.id}`;
    } else {
      // Ignore other events
      return new Response(JSON.stringify({ ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get admin subscriptions
    const { data: adminRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (!adminRoles || adminRoles.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", adminRoles.map((r: { user_id: string }) => r.user_id));

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({ title, body, url, tag });
    let sent = 0;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (err: unknown) {
        const error = err as { statusCode?: number };
        if (error.statusCode === 404 || error.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
