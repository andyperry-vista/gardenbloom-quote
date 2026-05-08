/**
 * Allowlist of every route registered in src/App.tsx.
 *
 * The Webmaster Console (and any other "site index" surface) MUST
 * filter its link list against this allowlist so a typo or stale entry
 * can never send a webmaster to a non-existent page.
 *
 * Keep this list in sync with the <Routes> in src/App.tsx.
 *
 * Static paths are listed verbatim. Dynamic routes use the React Router
 * pattern (e.g. "/admin/quotes/:id") — `isAllowedRoute` matches them
 * with a strict segment-by-segment comparison.
 */
export const REGISTERED_ROUTES = [
  // Public
  "/",
  "/admin/login",
  "/webmaster/login",
  "/agent/login",
  "/employee/login",
  "/unsubscribe",

  // Admin
  "/admin",
  "/admin/quotes/new",
  "/admin/quotes/:id",
  "/admin/quotes/:id/edit",
  "/admin/jobs",
  "/admin/jobs/:id",
  "/admin/invoices",
  "/admin/invoices/:id",
  "/admin/calendar",
  "/admin/clients",
  "/admin/materials",
  "/admin/tools",
  "/admin/settings",
  "/admin/agents",
  "/admin/packages",
  "/admin/quote-requests",
  "/admin/employees",
  "/admin/employees/:id/time-log",
  "/admin/payroll",
  "/admin/team",
  "/admin/webmaster",

  // Agent
  "/agent",
  "/agent/request",
  "/agent/jobs",
  "/agent/gallery",
  
  "/agent/contact",

  // Employee
  "/employee",
  "/employee/jobs",
  "/employee/jobs/:id",
  "/employee/hours",
] as const;

/** Returns true if `path` matches a route registered in App.tsx. */
export function isAllowedRoute(path: string): boolean {
  // Strip query string and hash before comparing.
  const clean = path.split("?")[0].split("#")[0];
  const target = clean.split("/").filter(Boolean);

  return REGISTERED_ROUTES.some((pattern) => {
    const parts = pattern.split("/").filter(Boolean);
    if (parts.length !== target.length) return false;
    return parts.every((part, i) => part.startsWith(":") || part === target[i]);
  });
}
