/**
 * Lightweight UI snapshot checks for the "Return to Homepage" button on the
 * three login routes. Confirms the button is present, top-left aligned, and
 * uses the iOS safe-area inset offset so it stays clear of the notch across
 * iPhone breakpoints (375×812, 390×844, 414×896).
 *
 * We assert against the className (Tailwind arbitrary value) rather than the
 * inline style because jsdom drops `calc(env(...))` from style.top.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock supabase so WebmasterLogin's session check resolves immediately
// to "no session", letting the login form (and Return to Homepage button)
// render synchronously.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ data: { user: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      signUp: () => Promise.resolve({ data: { user: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
  },
}));

import AdminLogin from "../AdminLogin";
import AgentLogin from "../AgentLogin";
import WebmasterLogin from "../WebmasterLogin";

const BREAKPOINTS = [
  { name: "iPhone SE/Mini (375×812)", w: 375, h: 812 },
  { name: "iPhone 12/13/14 (390×844)", w: 390, h: 844 },
  { name: "iPhone XR/11 (414×896)", w: 414, h: 896 },
];

const SAFE_AREA_TOP_CLASS = "top-[calc(env(safe-area-inset-top)+1rem)]";

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: height });
  window.dispatchEvent(new Event("resize"));
}

const routes = [
  { name: "Admin", Component: AdminLogin },
  { name: "Agent", Component: AgentLogin },
  { name: "Webmaster", Component: WebmasterLogin },
];

describe("Return to Homepage button alignment", () => {
  beforeEach(() => cleanup());

  for (const { name, Component } of routes) {
    describe(`${name} login`, () => {
      for (const bp of BREAKPOINTS) {
        it(`renders top-left with safe-area offset at ${bp.name}`, async () => {
          setViewport(bp.w, bp.h);
          render(
            <MemoryRouter>
              <Component />
            </MemoryRouter>
          );

          // Webmaster shows a session-check spinner first; wait for the
          // button to appear once the (mocked) check resolves.
          const btn = await waitFor(() =>
            screen.getAllByRole("button", { name: /return to homepage/i })[0]
          );

          // Top-left + safe-area offset are all expressed via Tailwind classes.
          expect(btn.className).toMatch(/\babsolute\b/);
          expect(btn.className).toMatch(/\bleft-4\b/);
          expect(btn.className).toContain(SAFE_AREA_TOP_CLASS);
        });
      }
    });
  }
});
