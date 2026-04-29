#!/usr/bin/env node
// Probes icon URLs on the live domain(s) and reports whether each returns 200
// for unauthenticated requests. Exits non-zero if any URL fails.
//
// Usage:
//   node scripts/check-live-icons.mjs
//   node scripts/check-live-icons.mjs --domain https://gardenbloom-quote.lovable.app
//   node scripts/check-live-icons.mjs --runs 3   # repeat each URL N times to catch flakiness

const DEFAULT_DOMAINS = [
  "https://www.mayuragardenservices.com.au",
  "https://mayuragardenservices.com.au",
  "https://gardenbloom-quote.lovable.app",
];

const ICON_PATHS = [
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/favicon-48x48.png",
  "/favicon-96x96.png",
  "/apple-touch-icon.png",
  
  "/manifest.json",
  "/og-image.jpg",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
];

function parseArgs(argv) {
  const out = { domains: null, runs: 1 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--domain" && argv[i + 1]) {
      out.domains = [argv[++i]];
    } else if (a === "--runs" && argv[i + 1]) {
      out.runs = Math.max(1, parseInt(argv[++i], 10) || 1);
    }
  }
  return out;
}

async function probe(url) {
  const started = Date.now();
  try {
    // HEAD first (cheapest); some CDNs reject HEAD, so fall back to GET.
    let res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: "GET", redirect: "follow" });
    }
    return {
      url,
      ok: res.status === 200,
      status: res.status,
      contentType: res.headers.get("content-type") || "",
      cacheControl: res.headers.get("cache-control") || "",
      ms: Date.now() - started,
    };
  } catch (err) {
    return { url, ok: false, status: 0, error: err.message, ms: Date.now() - started };
  }
}

async function main() {
  const { domains, runs } = parseArgs(process.argv);
  const targets = domains ?? DEFAULT_DOMAINS;

  console.log(`\n[check-live-icons] Probing ${ICON_PATHS.length} paths × ${targets.length} domain(s) × ${runs} run(s)\n`);

  const failures = [];
  const flaky = [];

  for (const domain of targets) {
    console.log(`── ${domain}`);
    for (const path of ICON_PATHS) {
      const url = domain + path;
      const results = [];
      for (let i = 0; i < runs; i++) {
        results.push(await probe(url));
      }
      const allOk = results.every((r) => r.ok);
      const anyOk = results.some((r) => r.ok);
      const last = results[results.length - 1];
      const statuses = results.map((r) => r.status).join(",");
      const mark = allOk ? "✓" : anyOk ? "⚠" : "✗";
      const detail = runs > 1 ? `[${statuses}]` : `${last.status}`;
      console.log(
        `  ${mark} ${path.padEnd(34)} ${detail.padEnd(14)} ${last.contentType.padEnd(24)} ${last.ms}ms`,
      );
      if (!allOk && anyOk) flaky.push({ url, statuses });
      if (!anyOk) failures.push({ url, statuses, error: last.error });
    }
    console.log("");
  }

  if (flaky.length) {
    console.log(`⚠ ${flaky.length} flaky URL(s) (succeeded sometimes, failed sometimes):`);
    flaky.forEach((f) => console.log(`  - ${f.url}  statuses=${f.statuses}`));
    console.log("");
  }

  if (failures.length) {
    console.log(`✗ ${failures.length} URL(s) never returned 200:`);
    failures.forEach((f) =>
      console.log(`  - ${f.url}  statuses=${f.statuses}${f.error ? `  error=${f.error}` : ""}`),
    );
    process.exit(1);
  }

  if (flaky.length) {
    process.exit(2);
  }

  console.log("✓ All probed icon URLs returned 200 on every run.");
}

main().catch((err) => {
  console.error("[check-live-icons] Unexpected error:", err);
  process.exit(1);
});
