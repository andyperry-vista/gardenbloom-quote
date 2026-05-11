/**
 * Lightweight UI snapshot checks for the "Return to Homepage" button on the
 * three login routes. These confirm the button is present, top-left aligned,
 * and uses the iOS safe-area inset offset so it stays clear of the notch
 * across iPhone breakpoints (375×812, 390×844, 414×896).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminLogin from "../AdminLogin";
import AgentLogin from "../AgentLogin";
import WebmasterLogin from "../WebmasterLogin";

const BREAKPOINTS = [
  { name: "iPhone SE/Mini (375×812)", w: 375, h: 812 },
  { name: "iPhone 12/13/14 (390×844)", w: 390, h: 844 },
  { name: "iPhone XR/11 (414×896)", w: 414, h: 896 },
];

const SAFE_AREA_TOP = "calc(env(safe-area-inset-top) + 1rem)";

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
        it(`renders top-left with safe-area offset at ${bp.name}`, () => {
          setViewport(bp.w, bp.h);
          render(
            <MemoryRouter>
              <Component />
            </MemoryRouter>
          );

          // Webmaster page briefly shows a session-check spinner; the button
          // appears once that resolves. getAllByRole handles the agent page,
          // which also renders the button in its signup-success state.
          const buttons = screen.queryAllByRole("button", { name: /return to homepage/i });
          expect(buttons.length).toBeGreaterThan(0);

          const btn = buttons[0];
          // Tailwind classes: absolutely positioned, flush to the left edge.
          expect(btn.className).toMatch(/\babsolute\b/);
          expect(btn.className).toMatch(/\bleft-4\b/);
          // Inline style uses the iOS safe-area inset so the button clears
          // the notch / Dynamic Island.
          expect(btn.getAttribute("style") || "").toContain(SAFE_AREA_TOP);
        });
      }
    });
  }
});
