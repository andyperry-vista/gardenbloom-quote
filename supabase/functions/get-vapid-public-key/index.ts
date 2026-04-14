import { corsHeaders } from "@supabase/supabase-js/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");

  return new Response(
    JSON.stringify({ vapidPublicKey: vapidPublicKey || null }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
