import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is an admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(url, serviceKey);
    const { data: callerRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const callerRoleSet = new Set((callerRoles ?? []).map((r) => r.role));
    const isCallerAdmin = callerRoleSet.has("admin") || callerRoleSet.has("webmaster");
    if (!isCallerAdmin) {
      return new Response(JSON.stringify({ error: "Admins only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, role } = await req.json();
    if (!email || !["admin", "manager", "webmaster"].includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // Only webmasters can grant the webmaster role
    if (role === "webmaster" && !callerRoleSet.has("webmaster")) {
      return new Response(JSON.stringify({ error: "Only a webmaster can grant the webmaster role" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find user by email
    let targetUserId: string | null = null;
    let page = 1;
    const target = String(email).trim().toLowerCase();
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      const found = data.users.find((u) => (u.email ?? "").toLowerCase() === target);
      if (found) { targetUserId = found.id; break; }
      if (data.users.length < 200) break;
      page++;
      if (page > 50) break;
    }
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "No account found for that email. Ask them to sign up first." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert role (idempotent via unique constraint)
    const { error: insErr } = await admin
      .from("user_roles")
      .insert({ user_id: targetUserId, role });
    if (insErr && !insErr.message.includes("duplicate")) throw insErr;

    return new Response(JSON.stringify({
      message: insErr ? "User already has that role" : `Granted ${role} to ${target}`,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("assign-role error:", e);
    return new Response(JSON.stringify({ error: "An internal error occurred. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
