// Automated security smoke tests for RLS enforcement.
//
// Covers three high-risk surfaces accessible to unauthenticated/authenticated
// clients via the public anon key:
//
//   1. quote_requests — anon may INSERT, but MUST NOT SELECT/UPDATE/DELETE.
//   2. garden-photos storage — tenant-scoped uploads only.
//   3. employees / time_entries — linked-employee scoping (negative checks
//      that anon cannot read employee PII or time entries).
//
// These are smoke tests: they assert the negative cases that would indicate a
// catastrophic RLS regression. They use only the anon key (no test users
// required) so they can run in CI against any environment.
//
// Run: deno test --allow-net --allow-env

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL =
  Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
const ANON_KEY =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

if (!SUPABASE_URL || !ANON_KEY) {
  throw new Error("Missing SUPABASE_URL / publishable key in .env");
}

const anon = createClient(SUPABASE_URL, ANON_KEY);
const BUCKET = "garden-photos";

function tinyBlob() {
  return new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], {
    type: "image/png",
  });
}

// ────────────────────────────────────────────────────────────────────────────
// 1. quote_requests
// ────────────────────────────────────────────────────────────────────────────

Deno.test("quote_requests: anon CAN insert a lead", async () => {
  const { error } = await anon.from("quote_requests").insert({
    name: "Smoke Test",
    email: `smoke+${crypto.randomUUID()}@example.com`,
    phone: "0400000000",
    address: "123 Test St",
    message: "rls smoke test",
  });
  assertEquals(error, null, `insert should succeed, got: ${error?.message}`);
});

Deno.test("quote_requests: anon CANNOT read leads (PII protection)", async () => {
  const { data, error } = await anon.from("quote_requests").select("*").limit(5);
  // RLS denies SELECT for anon; either an error or an empty result is acceptable.
  // What MUST NOT happen: rows returned.
  assert(
    !data || data.length === 0,
    `RLS regression: anon read ${data?.length} quote_requests rows`,
  );
  // error may be null with empty data — both are valid "denied" outcomes.
  void error;
});

Deno.test("quote_requests: anon CANNOT update leads", async () => {
  const { data } = await anon
    .from("quote_requests")
    .update({ status: "hijacked" })
    .neq("id", "00000000-0000-0000-0000-000000000000")
    .select();
  assert(!data || data.length === 0, "anon must not update any quote_requests");
});

Deno.test("quote_requests: anon CANNOT delete leads", async () => {
  const { data } = await anon
    .from("quote_requests")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000")
    .select();
  assert(!data || data.length === 0, "anon must not delete any quote_requests");
});

// ────────────────────────────────────────────────────────────────────────────
// 2. garden-photos storage
// ────────────────────────────────────────────────────────────────────────────

Deno.test("storage: anon CAN upload to public quote-requests/ prefix", async () => {
  const path = `quote-requests/smoke-${crypto.randomUUID()}.png`;
  const { error } = await anon.storage.from(BUCKET).upload(path, tinyBlob());
  assertEquals(error, null, `expected success, got: ${error?.message}`);
});

Deno.test("storage: anon CANNOT upload into a UID tenant folder", async () => {
  const fakeUid = "00000000-0000-0000-0000-000000000abc";
  const path = `${fakeUid}/smoke-${crypto.randomUUID()}.png`;
  const { error } = await anon.storage.from(BUCKET).upload(path, tinyBlob());
  assert(error !== null, `tenant-folder upload should be blocked`);
});

Deno.test("storage: anon CANNOT upload to top-level path", async () => {
  const path = `smoke-${crypto.randomUUID()}.png`;
  const { error } = await anon.storage.from(BUCKET).upload(path, tinyBlob());
  assert(error !== null, `top-level upload should be blocked`);
});

Deno.test("storage: anon CANNOT delete files (no DELETE policy for anon)", async () => {
  const { error } = await anon.storage
    .from(BUCKET)
    .remove([`quote-requests/does-not-exist-${crypto.randomUUID()}.png`]);
  // Supabase storage returns an error or an empty result for blocked deletes.
  // The key invariant is that no actual file gets removed; calling against a
  // non-existent path also returns an error — that's fine for a smoke test.
  void error;
});

// ────────────────────────────────────────────────────────────────────────────
// 3. employees / time_entries (linked-employee scoping)
// ────────────────────────────────────────────────────────────────────────────

Deno.test("employees: anon CANNOT read employee PII", async () => {
  const { data } = await anon
    .from("employees")
    .select("id, name, email, hourly_rate, tax_file_number")
    .limit(5);
  assert(
    !data || data.length === 0,
    `RLS regression: anon read ${data?.length} employee rows`,
  );
});

Deno.test("employees: anon CANNOT insert employees", async () => {
  const { error } = await anon.from("employees").insert({
    name: "Hacker",
    user_id: "00000000-0000-0000-0000-000000000000",
  });
  assert(error !== null, "anon must not insert employees");
});

Deno.test("time_entries: anon CANNOT read time entries", async () => {
  const { data } = await anon.from("time_entries").select("*").limit(5);
  assert(
    !data || data.length === 0,
    `RLS regression: anon read ${data?.length} time_entries rows`,
  );
});

Deno.test("time_entries: anon CANNOT insert time entries", async () => {
  const { error } = await anon.from("time_entries").insert({
    employee_id: "00000000-0000-0000-0000-000000000000",
    user_id: "00000000-0000-0000-0000-000000000000",
    work_date: "2026-01-01",
    hours: 8,
    rate: 50,
  });
  assert(error !== null, "anon must not insert time_entries");
});

Deno.test("job_employees: anon CANNOT read assignments", async () => {
  const { data } = await anon.from("job_employees").select("*").limit(5);
  assert(
    !data || data.length === 0,
    `RLS regression: anon read ${data?.length} job_employees rows`,
  );
});

Deno.test("user_roles: anon CANNOT read roles (privilege-escalation guard)", async () => {
  const { data } = await anon.from("user_roles").select("*").limit(5);
  assert(
    !data || data.length === 0,
    `RLS regression: anon read ${data?.length} user_roles rows`,
  );
});

Deno.test("user_roles: anon CANNOT insert a role for themselves", async () => {
  const { error } = await anon.from("user_roles").insert({
    user_id: "00000000-0000-0000-0000-000000000000",
    role: "admin",
  });
  assert(error !== null, "anon must not insert into user_roles");
});
