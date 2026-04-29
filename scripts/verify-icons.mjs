// Verifies that every favicon/icon/manifest reference in index.html and
// public/manifest.json (and public/browserconfig.xml) points to a file that
// actually exists in public/. Throws on first missing file so the build fails
// loudly instead of shipping 404s.
//
// Usage:
//   import { verifyIcons } from "./scripts/verify-icons.mjs";
//   verifyIcons({ root: process.cwd() });

import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const ICON_EXT_RE = /\.(png|ico|svg|webp|jpg|jpeg|gif)$/i;

function stripQuery(p) {
  const i = p.indexOf("?");
  return i === -1 ? p : p.slice(0, i);
}

function collectFromHtml(html) {
  const refs = new Set();
  // href="..." and content="..." attributes
  const attrRe = /(?:href|content|src)\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = attrRe.exec(html)) !== null) {
    const v = m[1];
    if (v.startsWith("/") && ICON_EXT_RE.test(stripQuery(v))) refs.add(v);
  }
  return refs;
}

function collectFromManifest(json) {
  const refs = new Set();
  if (Array.isArray(json.icons)) {
    for (const ic of json.icons) {
      if (ic && typeof ic.src === "string" && ic.src.startsWith("/")) refs.add(ic.src);
    }
  }
  return refs;
}

function collectFromBrowserConfig(xml) {
  const refs = new Set();
  const re = /src\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const v = m[1];
    if (v.startsWith("/") && ICON_EXT_RE.test(stripQuery(v))) refs.add(v);
  }
  return refs;
}

export function verifyIcons({ root = process.cwd() } = {}) {
  const publicDir = resolve(root, "public");
  const indexHtml = resolve(root, "index.html");
  const manifestPath = resolve(publicDir, "manifest.json");
  const browserConfigPath = resolve(publicDir, "browserconfig.xml");

  const all = new Set();
  const sources = [];

  if (existsSync(indexHtml)) {
    const refs = collectFromHtml(readFileSync(indexHtml, "utf8"));
    refs.forEach((r) => all.add(r));
    sources.push(`index.html (${refs.size} refs)`);
  }
  if (existsSync(manifestPath)) {
    try {
      const refs = collectFromManifest(JSON.parse(readFileSync(manifestPath, "utf8")));
      refs.forEach((r) => all.add(r));
      sources.push(`public/manifest.json (${refs.size} refs)`);
    } catch (e) {
      throw new Error(`[verify-icons] Failed to parse public/manifest.json: ${e.message}`);
    }
  }
  if (existsSync(browserConfigPath)) {
    const refs = collectFromBrowserConfig(readFileSync(browserConfigPath, "utf8"));
    refs.forEach((r) => all.add(r));
    sources.push(`public/browserconfig.xml (${refs.size} refs)`);
  }

  const missing = [];
  for (const ref of all) {
    const filePath = join(publicDir, stripQuery(ref).replace(/^\//, ""));
    if (!existsSync(filePath)) missing.push(ref);
  }

  if (missing.length > 0) {
    const list = missing.map((m) => `  - ${m}`).join("\n");
    throw new Error(
      `[verify-icons] ${missing.length} referenced icon file(s) missing from public/:\n${list}\n` +
        `Sources scanned: ${sources.join(", ")}\n` +
        `Add the missing files or remove the references before building.`,
    );
  }

  // eslint-disable-next-line no-console
  console.log(
    `[verify-icons] ✓ All ${all.size} icon reference(s) resolved (${sources.join(", ")}).`,
  );
}
