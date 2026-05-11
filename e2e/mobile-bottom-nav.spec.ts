import { test, expect } from "../playwright-fixture";

const TABS = ["Dashboard", "Quotes", "Jobs", "Emails", "Clients"] as const;

const VIEWPORTS = [
  { name: "iPhone X portrait", width: 375, height: 812 },
  { name: "iPhone 12 portrait", width: 390, height: 844 },
  { name: "iPhone XR portrait", width: 414, height: 896 },
  { name: "iPhone X landscape", width: 812, height: 375 },
];

const ADMIN_EMAIL = "nicholas@mayuragardenservices.com.au";
const ADMIN_PASSWORD = "Mayura2026!";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  // If already authenticated, we may be redirected.
  if (!page.url().includes("/admin/login")) return;
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 15_000 });
}

test.describe("MobileBottomNav across breakpoints", () => {
  for (const vp of VIEWPORTS) {
    test(`renders all tabs and icons at ${vp.name} (${vp.width}x${vp.height})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginAsAdmin(page);
      await page.goto("/admin");

      const nav = page.locator("nav.fixed.bottom-0");
      await expect(nav).toBeVisible();

      for (const label of TABS) {
        const btn = nav.getByRole("button", { name: new RegExp(`^${label}`, "i") });
        await expect(btn).toBeVisible();
        await expect(btn).toBeEnabled();
        // Icon (lucide svg) present inside the button
        await expect(btn.locator("svg")).toHaveCount(1);
        // Label text visible
        await expect(btn.getByText(label, { exact: true })).toBeVisible();
      }
    });

    test(`tabs are clickable and route at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginAsAdmin(page);
      await page.goto("/admin");

      const nav = page.locator("nav.fixed.bottom-0");
      const cases: Array<[string, RegExp]> = [
        ["Quotes", /\/admin\/quote-requests/],
        ["Jobs", /\/admin\/jobs/],
        ["Emails", /\/admin\/emails/],
        ["Clients", /\/admin\/clients/],
        ["Dashboard", /\/admin$/],
      ];
      for (const [label, urlRe] of cases) {
        await nav.getByRole("button", { name: new RegExp(`^${label}`, "i") }).click();
        await page.waitForURL(urlRe, { timeout: 10_000 });
      }
    });
  }
});
