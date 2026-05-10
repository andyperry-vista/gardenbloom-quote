import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Caller (must be admin)
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (roleErr || !isAdmin) return json({ error: "Admin only" }, 403);

    const body = await req.json().catch(() => ({}));
    const employeeId: string | undefined = body?.employeeId;
    const email: string | undefined = (body?.email || "").toString().trim().toLowerCase();
    if (!employeeId || !email) return json({ error: "employeeId and email required" }, 400);

    const { data: emp, error: empErr } = await admin
      .from("employees")
      .select("id, name, user_id, linked_user_id")
      .eq("id", employeeId)
      .maybeSingle();
    if (empErr || !emp) return json({ error: "Employee not found" }, 404);
    if (emp.user_id !== user.id) return json({ error: "Not your employee record" }, 403);
    if (emp.linked_user_id) return json({ error: "Employee already invited / linked" }, 409);

    // 1) Check whether an auth user with this email already exists
    let authUserId: string | null = null;
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users?.find((u) => (u.email || "").toLowerCase() === email);

    const origin = req.headers.get("origin") || `${SUPABASE_URL}`;
    const redirectTo = `${origin}/employee/login`;

    if (existing) {
      authUserId = existing.id;
    } else {
      const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: { role: "employee", employee_name: emp.name },
      });
      if (inviteErr || !invited?.user) return json({ error: inviteErr?.message || "Invite failed" }, 500);
      authUserId = invited.user.id;
    }

    // 2) Link employee record
    const { error: linkErr } = await admin
      .from("employees")
      .update({ linked_user_id: authUserId, email })
      .eq("id", employeeId);
    if (linkErr) return json({ error: linkErr.message }, 500);

    // 3) Grant employee role (idempotent)
    const { data: existingRole } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", authUserId)
      .eq("role", "employee")
      .maybeSingle();
    if (!existingRole) {
      const { error: roleInsertErr } = await admin
        .from("user_roles")
        .insert({ user_id: authUserId, role: "employee" });
      if (roleInsertErr) {
        console.error("invite-employee role insert error:", roleInsertErr);
        return json({ error: "An internal error occurred. Please try again." }, 500);
      }
    }

    return json({ ok: true, alreadyHadAccount: !!existing, authUserId });
  } catch (e) {
    console.error("invite-employee error:", e);
    return json({ error: "An internal error occurred. Please try again." }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
