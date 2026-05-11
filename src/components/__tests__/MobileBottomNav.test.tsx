import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import MobileBottomNav from "@/components/MobileBottomNav";

vi.mock("@/hooks/useQuoteRequests", () => ({
  useQuoteRequests: () => ({ requests: [] }),
}));
vi.mock("@/hooks/useJobs", () => ({
  useJobs: () => ({ jobs: [] }),
}));

const TABS = [
  { label: "Dashboard", path: "/admin" },
  { label: "Quotes", path: "/admin/quote-requests" },
  { label: "Jobs", path: "/admin/jobs" },
  { label: "Emails", path: "/admin/emails" },
  { label: "Clients", path: "/admin/clients" },
];

const VIEWPORTS = [
  { name: "iPhone X (375x812)", w: 375, h: 812 },
  { name: "iPhone 12 (390x844)", w: 390, h: 844 },
  { name: "iPhone XR (414x896)", w: 414, h: 896 },
  { name: "Landscape (812x375)", w: 812, h: 375 },
];

function setViewport(w: number, h: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: w });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: h });
  window.dispatchEvent(new Event("resize"));
}

function renderNav() {
  return render(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route path="*" element={<MobileBottomNav />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("MobileBottomNav across mobile breakpoints", () => {
  beforeEach(() => cleanup());

  for (const vp of VIEWPORTS) {
    describe(vp.name, () => {
      beforeEach(() => setViewport(vp.w, vp.h));

      it("renders all five tab labels", () => {
        renderNav();
        for (const tab of TABS) {
          expect(screen.getByText(tab.label)).toBeInTheDocument();
        }
      });

      it("renders an icon (svg) inside each tab button", () => {
        renderNav();
        const buttons = screen.getAllByRole("button");
        expect(buttons).toHaveLength(TABS.length);
        for (const btn of buttons) {
          expect(btn.querySelector("svg")).not.toBeNull();
        }
      });

      it("each tab is clickable (enabled, not hidden)", () => {
        renderNav();
        for (const tab of TABS) {
          const btn = screen.getByRole("button", { name: new RegExp(`^${tab.label}`, "i") });
          expect(btn).toBeEnabled();
          expect(btn).toBeVisible();
          // Should not throw when clicked
          fireEvent.click(btn);
        }
      });
    });
  }
});
