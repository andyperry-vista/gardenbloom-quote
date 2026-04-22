/**
 * Screenshot capture script for Mayura Garden Services documentation.
 * Uses Playwright to capture all pages at 1280×900 (A4-proportionate).
 * Saves PNGs to scripts/doc-screenshots/
 */

import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, 'doc-screenshots');
mkdirSync(OUT_DIR, { recursive: true });

const BASE_URL = 'http://localhost:8080';
const ADMIN_EMAIL = 'nicholas@mayuragardenservices.com.au';
const ADMIN_PW = 'Mayura2026!';
const AGENT_EMAIL = 'perry.andyjames@gmail.com';
const AGENT_PW = 'Ap80!248';

// Viewport for A4-proportionate screenshots (1240px wide → ~1754px at 96dpi A4)
const VIEWPORT = { width: 1280, height: 900 };
const MOBILE_VIEWPORT = { width: 390, height: 844 }; // iPhone 14 Pro

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function screenshot(page, filename, opts = {}) {
  await wait(opts.delay ?? 1200);
  const path = resolve(OUT_DIR, filename);
  await page.screenshot({ path, fullPage: opts.fullPage ?? false, ...( opts.clip ? { clip: opts.clip } : {}) });
  console.log(`  ✓ ${filename}`);
  return path;
}

async function dismissModals(page) {
  // Close any open toast or dialog that might obscure content
  try {
    const closeBtn = page.locator('[data-sonner-toast] button, [aria-label="Close"]').first();
    if (await closeBtn.isVisible({ timeout: 500 })) await closeBtn.click();
  } catch {}
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // ─────────────────────────────────────────────────
  // 1. PUBLIC PAGES
  // ─────────────────────────────────────────────────
  console.log('\n📸 PUBLIC PAGES');
  {
    const ctx = await browser.newContext({ viewport: VIEWPORT });
    const page = await ctx.newPage();

    // Landing page – above fold (hero section)
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await screenshot(page, '01_landing_hero.png');

    // Landing page – services section
    // Scroll to the top of the services section (first section.container after the hero)
    await page.evaluate(() => {
      // All <section> elements on the page
      const sections = Array.from(document.querySelectorAll('section'));
      // The services section is the second <section> (index 1, after the hero)
      const el = sections[1];
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'instant' });
    });
    await screenshot(page, '02_landing_services.png', { delay: 600 });

    // Landing page – before/after gallery
    // BeforeAfterGallery renders as section.bg-muted/50 — first one in the page
    await page.evaluate(() => {
      // Find by the gallery heading text or the bg-muted section
      const allSections = Array.from(document.querySelectorAll('section'));
      // Gallery is the section with a grid of 3 before/after cards (bg-muted/50 before quote form)
      // It is sections[2] in the sequence: hero, beforeafterreveal(div), services, gallery, sharing, steps, quote
      // Actually BeforeAfterReveal is a div, so sections: [0]hero [1]services [2]gallery [3]sharing [4]steps [5]quote-form
      const el = allSections[2];
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'instant' });
    });
    await screenshot(page, '03_landing_gallery.png', { delay: 600 });

    // Landing page – quote request form
    await page.evaluate(() => {
      const el = document.querySelector('#quote-form');
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'instant' });
    });
    await screenshot(page, '04_landing_quote_form.png', { delay: 600 });

    // Landing page – social sharing section
    await page.evaluate(() => {
      // Social sharing is sections[3] (after hero, services, gallery)
      const allSections = Array.from(document.querySelectorAll('section'));
      const el = allSections[3];
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'instant' });
    });
    await screenshot(page, '05_landing_social_sharing.png', { delay: 600 });

    // Full landing page (smaller viewport scroll)
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await screenshot(page, '06_landing_full.png', { fullPage: true, delay: 1500 });

    await ctx.close();
  }

  // ─────────────────────────────────────────────────
  // 2. AGENT LOGIN
  // ─────────────────────────────────────────────────
  console.log('\n📸 AGENT LOGIN & PORTAL');
  {
    const ctx = await browser.newContext({ viewport: VIEWPORT });
    const page = await ctx.newPage();

    await page.goto(`${BASE_URL}/agent/login`, { waitUntil: 'networkidle' });
    await screenshot(page, '07_agent_login.png');

    // Show signup tab
    const signupTab = page.locator('button:has-text("Sign Up"), [role="tab"]:has-text("Sign"), [data-value="signup"]').first();
    if (await signupTab.isVisible({ timeout: 2000 })) {
      await signupTab.click();
      await screenshot(page, '08_agent_signup.png', { delay: 600 });
    }

    // Log in as agent
    const loginTab = page.locator('button:has-text("Login"), button:has-text("Sign In"), [role="tab"]:has-text("Login"), [data-value="login"]').first();
    if (await loginTab.isVisible({ timeout: 2000 })) await loginTab.click();
    await page.fill('input[type="email"]', AGENT_EMAIL);
    await page.fill('input[type="password"]', AGENT_PW);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/agent/, { timeout: 15000 });
    await wait(1500);

    await screenshot(page, '09_agent_dashboard.png');

    // Agent Quote Request
    await page.goto(`${BASE_URL}/agent/request`, { waitUntil: 'networkidle' });
    await screenshot(page, '10_agent_quote_request.png');

    // Agent Jobs
    await page.goto(`${BASE_URL}/agent/jobs`, { waitUntil: 'networkidle' });
    await screenshot(page, '11_agent_jobs.png');

    // Agent Gallery
    await page.goto(`${BASE_URL}/agent/gallery`, { waitUntil: 'networkidle' });
    await screenshot(page, '12_agent_gallery.png');

    // Agent Referrals
    await page.goto(`${BASE_URL}/agent/referrals`, { waitUntil: 'networkidle' });
    await screenshot(page, '13_agent_referrals.png');

    // Agent Contact
    await page.goto(`${BASE_URL}/agent/contact`, { waitUntil: 'networkidle' });
    await screenshot(page, '14_agent_contact.png');

    await ctx.close();
  }

  // ─────────────────────────────────────────────────
  // 3. ADMIN LOGIN & PORTAL
  // ─────────────────────────────────────────────────
  console.log('\n📸 ADMIN LOGIN & PORTAL');
  {
    const ctx = await browser.newContext({ viewport: VIEWPORT });
    const page = await ctx.newPage();

    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });
    await screenshot(page, '15_admin_login.png');

    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PW);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    await wait(2000);

    await screenshot(page, '16_admin_dashboard.png');

    // Quote Requests
    await page.goto(`${BASE_URL}/admin/quote-requests`, { waitUntil: 'networkidle' });
    await wait(1500);
    await screenshot(page, '17_admin_quote_requests.png');

    // Quotes / New Quote
    await page.goto(`${BASE_URL}/admin/quotes/new`, { waitUntil: 'networkidle' });
    await wait(1500);
    await screenshot(page, '18_admin_quote_editor.png');

    // Jobs
    await page.goto(`${BASE_URL}/admin/jobs`, { waitUntil: 'networkidle' });
    await wait(1500);
    await screenshot(page, '19_admin_jobs.png');

    // Invoices
    await page.goto(`${BASE_URL}/admin/invoices`, { waitUntil: 'networkidle' });
    await wait(1500);
    await screenshot(page, '20_admin_invoices.png');

    // Clients
    await page.goto(`${BASE_URL}/admin/clients`, { waitUntil: 'networkidle' });
    await wait(1500);
    await screenshot(page, '21_admin_clients.png');

    // Calendar
    await page.goto(`${BASE_URL}/admin/calendar`, { waitUntil: 'networkidle' });
    await wait(1500);
    await screenshot(page, '22_admin_calendar.png');

    // Materials
    await page.goto(`${BASE_URL}/admin/materials`, { waitUntil: 'networkidle' });
    await wait(1500);
    await screenshot(page, '23_admin_materials.png');

    // Packages
    await page.goto(`${BASE_URL}/admin/packages`, { waitUntil: 'networkidle' });
    await wait(1500);
    await screenshot(page, '24_admin_packages.png');

    // Agents management
    await page.goto(`${BASE_URL}/admin/agents`, { waitUntil: 'networkidle' });
    await wait(1500);
    await screenshot(page, '25_admin_agents.png');

    // Settings
    await page.goto(`${BASE_URL}/admin/settings`, { waitUntil: 'networkidle' });
    await wait(1500);
    await screenshot(page, '26_admin_settings.png');

    // Business Tools
    await page.goto(`${BASE_URL}/admin/tools`, { waitUntil: 'networkidle' });
    await wait(1500);
    await screenshot(page, '27_business_tools.png');

    // Business Tools – scrolled to show templates
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
    await screenshot(page, '28_business_tools_templates.png', { delay: 600 });

    await ctx.close();
  }

  // ─────────────────────────────────────────────────
  // 4. MOBILE / PWA VIEWS
  // ─────────────────────────────────────────────────
  console.log('\n📸 MOBILE / PWA VIEWS');
  {
    const ctx = await browser.newContext({
      viewport: MOBILE_VIEWPORT,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      isMobile: true,
      hasTouch: true,
    });
    const page = await ctx.newPage();

    // Mobile landing page
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await screenshot(page, '29_mobile_landing.png');

    // Mobile landing – scrolled to show social share
    await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'instant' }));
    await screenshot(page, '30_mobile_services.png', { delay: 600 });

    // Log in as admin on mobile
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PW);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    await wait(2000);

    // Mobile admin dashboard (shows bottom nav)
    await screenshot(page, '31_mobile_admin_dashboard.png');

    // Mobile admin jobs
    await page.goto(`${BASE_URL}/admin/jobs`, { waitUntil: 'networkidle' });
    await wait(1200);
    await screenshot(page, '32_mobile_admin_jobs.png');

    // Mobile quote editor
    await page.goto(`${BASE_URL}/admin/quotes/new`, { waitUntil: 'networkidle' });
    await wait(1200);
    await screenshot(page, '33_mobile_quote_editor.png');

    await ctx.close();
  }

  // ─────────────────────────────────────────────────
  // 5. SEO META VIEWS
  // ─────────────────────────────────────────────────
  console.log('\n📸 SEO ASSETS');
  {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 } });
    const page = await ctx.newPage();

    // OG image preview simulation
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    // Show WeChat QR modal
    const wechatBtn = page.locator('button:has-text("WeChat"), [aria-label*="WeChat"]').first();
    if (await wechatBtn.isVisible({ timeout: 2000 })) {
      await wechatBtn.click();
      await wait(800);
      await screenshot(page, '34_wechat_modal.png', { delay: 400 });
      await page.keyboard.press('Escape');
    }

    // Language toggle demo
    const langToggle = page.locator('button:has-text("中"), button:has-text("CN"), [aria-label*="language"], [aria-label*="Language"]').first();
    if (await langToggle.isVisible({ timeout: 2000 })) {
      await langToggle.click();
      await wait(600);
      await screenshot(page, '35_language_chinese.png', { delay: 400 });
    }

    await ctx.close();
  }

  await browser.close();
  console.log(`\n✅ All screenshots saved to ${OUT_DIR}\n`);
}

run().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
