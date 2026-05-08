// Regression tests for process-email-queue auth.
//
// Verifies that with `verify_jwt = true` (gateway) AND in-code role check via
// supabase.auth.getClaims(), forged or non-service-role JWTs cannot reach the
// queue-processing logic.
//
// Run with: deno test --allow-net --allow-env supabase/functions/process-email-queue/index.test.ts

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import {
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { encodeBase64Url } from "https://deno.land/std@0.224.0/encoding/base64url.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
const ANON_KEY =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

if (!SUPABASE_URL || !ANON_KEY) {
  throw new Error(
    "Missing SUPABASE_URL / publishable key in env. Ensure .env is populated.",
  );
}

const FN_URL = `${SUPABASE_URL}/functions/v1/process-email-queue`;

// Build an unsigned JWT with arbitrary claims. The signature segment is random
// bytes — it will NEVER match the project's signing key, so the gateway must
// reject it when verify_jwt = true.
function forgeJwt(claims: Record<string, unknown>): string {
  const header = { alg: "HS256", typ: "JWT" };
  const enc = (obj: unknown) =>
    encodeBase64Url(new TextEncoder().encode(JSON.stringify(obj)));
  const payload = {
    iss: "supabase",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...claims,
  };
  const fakeSig = encodeBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  return `${enc(header)}.${enc(payload)}.${fakeSig}`;
}

async function call(headers: Record<string, string>) {
  const res = await fetch(FN_URL, { method: "POST", headers });
  const body = await res.text(); // always consume
  return { status: res.status, body };
}

Deno.test("rejects requests with no Authorization header", async () => {
  const { status } = await call({});
  // Gateway returns 401 when verify_jwt = true and no token is provided.
  assertEquals(status, 401);
});

Deno.test("rejects malformed Authorization header (no Bearer)", async () => {
  const { status } = await call({ Authorization: "garbage" });
  assertEquals(status, 401);
});

Deno.test("rejects forged JWT claiming service_role (bad signature)", async () => {
  const forged = forgeJwt({ role: "service_role", sub: "attacker" });
  const { status, body } = await call({ Authorization: `Bearer ${forged}` });
  // Gateway must reject before our handler runs. Must NOT be 200.
  assertEquals(status, 401, `expected 401, got ${status}: ${body}`);
  assertNotEquals(status, 200);
});

Deno.test("rejects forged JWT with admin role and bad signature", async () => {
  const forged = forgeJwt({ role: "admin", sub: "attacker" });
  const { status } = await call({ Authorization: `Bearer ${forged}` });
  assertEquals(status, 401);
});

Deno.test("rejects valid anon JWT (signed but role != service_role)", async () => {
  // The publishable/anon key is a real signed JWT with role=anon. The gateway
  // accepts it, but the in-code getClaims() check must reject it with 403.
  const { status, body } = await call({
    Authorization: `Bearer ${ANON_KEY}`,
    apikey: ANON_KEY!,
  });
  assertEquals(status, 403, `expected 403, got ${status}: ${body}`);
});

Deno.test("rejects expired/random opaque token", async () => {
  const { status } = await call({
    Authorization: "Bearer not.a.valid.jwt.at.all",
  });
  assertEquals(status, 401);
});
