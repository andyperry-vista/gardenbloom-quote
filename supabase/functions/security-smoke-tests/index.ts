// Test-only function shell. Holds RLS security smoke tests.
// Returns 404 if invoked over HTTP — not intended for runtime use.
Deno.serve(() => new Response("not found", { status: 404 }));
