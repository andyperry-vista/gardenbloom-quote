// Bootstrap a dedicated webmaster account.
// - Caller must be a signed-in admin (or existing webmaster).
// - Creates a new auth user with the supplied email + password (auto-confirmed).
// - Grants them the 'webmaster' role.
// - If a webmaster already exists, only an existing webmaster can call this.
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

    // Check caller's roles
    const { data: callerRoles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roleSet = new Set((callerRoles ?? []).map((r) => r.role));
    const callerIsAdmin = roleSet.has("admin");
    const callerIsWebmaster = roleSet.has("webmaster");

    if (!callerIsAdmin && !callerIsWebmaster) {
      return new Response(JSON.stringify({ error: "Admins only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If any webmaster exists, only a webmaster can provision more.
    const { count: webmasterCount } = await admin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "webmaster");
    if ((webmasterCount ?? 0) > 0 && !callerIsWebmaster) {
      return new Response(JSON.stringify({
        error: "A webmaster already exists. Only an existing webmaster can create another.",
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!email.includes("@") || password.length < 8) {
      return new Response(JSON.stringify({ error: "Email and a password of at least 8 characters are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find or create the auth user
    let targetUserId: string | null = null;
    let page = 1;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw error;
      const found = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
      if (found) { targetUserId = found.id; break; }
      if (data.users.length < 200) break;
      page++;
      if (page > 50) break;
    }

    if (!targetUserId) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr) throw createErr;
      targetUserId = created.user!.id;
    } else {
      // Refuse to reset the password of an existing user unless they ALREADY hold a
      // privileged role. Otherwise an admin (or compromised admin) could overwrite
      // any customer's password and hijack the account.
      const { data: targetRoles } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", targetUserId);
      const targetRoleSet = new Set((targetRoles ?? []).map((r) => r.role));
      const targetIsPrivileged =
        targetRoleSet.has("admin") ||
        targetRoleSet.has("webmaster") ||
        targetRoleSet.has("manager");
      if (!targetIsPrivileged) {
        return new Response(JSON.stringify({
          error: "An account with this email already exists and is not a privileged user. Refusing to reset its password.",
        }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      // Reset password for existing privileged account so caller knows the credentials
      const { error: updErr } = await admin.auth.admin.updateUserById(targetUserId, {
        password,
        email_confirm: true,
      });
      if (updErr) throw updErr;
    }

    // Grant webmaster role (idempotent)
    const { error: insErr } = await admin
      .from("user_roles")
      .insert({ user_id: targetUserId, role: "webmaster" });
    if (insErr && !insErr.message.includes("duplicate")) throw insErr;

    return new Response(JSON.stringify({
      message: `Webmaster account ready: ${email}`,
      user_id: targetUserId,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("provision-webmaster error:", e);
    return new Response(JSON.stringify({ error: "An internal error occurred. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
