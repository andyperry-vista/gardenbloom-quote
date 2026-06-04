import { chromium } from "@playwright/test";
import puppeteer from "puppeteer";
import { mkdirSync, existsSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = resolve(__dirname, "current-tour-screenshots");
const OUT_PDF = resolve(ROOT, "Mayura_Garden_Services_Current_Site_Tour.pdf");

const BASE_URL = process.env.MAYURA_BASE_URL || "http://localhost:8080";
const ADMIN_EMAIL = process.env.MAYURA_ADMIN_EMAIL || "nicholas@mayuragardenservices.com.au";
const ADMIN_PW = process.env.MAYURA_ADMIN_PASSWORD || "Mayura2026!";
const AGENT_EMAIL = process.env.MAYURA_AGENT_EMAIL || "perry.andyjames@gmail.com";
const AGENT_PW = process.env.MAYURA_AGENT_PASSWORD || "Ap80!248";

const desktop = { width: 1365, height: 900 };
const mobile = { width: 390, height: 844 };

mkdirSync(OUT_DIR, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function goto(page, path) {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => {});
  await sleep(900);
}

async function shot(page, filename, options = {}) {
  await sleep(options.delay ?? 500);
  const path = resolve(OUT_DIR, filename);
  await page.screenshot({ path, fullPage: options.fullPage ?? false });
  console.log(`  captured ${filename}`);
}

async function scrollToSelector(page, selector) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ block: "start", behavior: "instant" });
  }, selector);
  await sleep(500);
}

async function scrollToSection(page, index) {
  await page.evaluate((i) => {
    const sections = Array.from(document.querySelectorAll("section"));
    const el = sections[i];
    if (el) el.scrollIntoView({ block: "start", behavior: "instant" });
  }, index);
  await sleep(500);
}

async function elementShot(page, selector, filename) {
  const locator = page.locator(selector).first();
  await locator.scrollIntoViewIfNeeded();
  await sleep(500);
  const path = resolve(OUT_DIR, filename);
  await locator.screenshot({ path });
  console.log(`  captured ${filename}`);
}

async function sectionShotByHeading(page, headingText, filename) {
  const handle = await page.evaluateHandle((text) => {
    const headings = Array.from(document.querySelectorAll("h2,h3"));
    const heading = headings.find((el) => (el.textContent || "").toLowerCase().includes(text.toLowerCase()));
    return heading?.closest("section") || null;
  }, headingText);
  const el = handle.asElement();
  if (!el) throw new Error(`Could not find landing section for heading: ${headingText}`);
  await el.scrollIntoViewIfNeeded();
  await sleep(500);
  const path = resolve(OUT_DIR, filename);
  await el.screenshot({ path });
  console.log(`  captured ${filename}`);
}

async function login(page, kind) {
  const target = kind === "admin" ? /\/admin(?!\/login)/ : /\/agent(?!\/login)/;
  const candidates = kind === "admin"
    ? [[ADMIN_EMAIL, ADMIN_PW, "admin"]]
    : [
        [AGENT_EMAIL, AGENT_PW, "agent"],
        [ADMIN_EMAIL, ADMIN_PW, "webmaster fallback"],
      ];

  for (const [email, password, label] of candidates) {
    await page.fill('input[type="email"]', "");
    await page.fill('input[type="password"]', "");
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    try {
      await page.waitForURL(target, { timeout: 12000 });
      await page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => {});
      await sleep(1500);
      if (label !== kind) console.log(`  used ${label} login for ${kind} screenshots`);
      return;
    } catch {
      const errorText = await page.locator(".text-destructive").first().textContent({ timeout: 1000 }).catch(() => "");
      console.warn(`  ${kind} login attempt with ${label} credentials did not enter portal${errorText ? `: ${errorText}` : ""}`);
    }
  }

  throw new Error(`Unable to sign in for ${kind} screenshots`);
}

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });

  console.log("\nPublic landing page");
  {
    const ctx = await browser.newContext({ viewport: desktop });
    const page = await ctx.newPage();
    await goto(page, "/");
    await elementShot(page, "main > section", "01_landing_hero.png");
    await sectionShotByHeading(page, "Our Services", "02_landing_services.png");
    await sectionShotByHeading(page, "Transformations", "03_landing_gallery.png");
    await sectionShotByHeading(page, "Share with friends", "04_landing_social.png");
    await scrollToSelector(page, "#quote-form");
    await elementShot(page, "#quote-form", "05_landing_quote_form.png");
    await goto(page, "/");
    await shot(page, "06_landing_full_page.png", { fullPage: true, delay: 1000 });
    const languageButton = page.locator('button:has-text("中"), button[aria-label*="language"], button[aria-label*="Language"]').first();
    if (await languageButton.isVisible({ timeout: 1500 }).catch(() => false)) {
      await languageButton.click();
      await sleep(700);
      await shot(page, "07_landing_chinese.png");
    }
    await ctx.close();
  }

  console.log("\nAdmin desktop portal");
  {
    const ctx = await browser.newContext({ viewport: desktop });
    const page = await ctx.newPage();
    await goto(page, "/admin/login");
    await shot(page, "10_admin_login.png");
    await login(page, "admin");
    await shot(page, "11_admin_dashboard.png");
    const adminRoutes = [
      ["/admin/quote-requests", "12_admin_quote_requests.png"],
      ["/admin/quotes/new", "13_admin_quote_editor.png"],
      ["/admin/materials", "14_admin_materials.png"],
      ["/admin/packages", "15_admin_packages.png"],
      ["/admin/jobs", "16_admin_jobs.png"],
      ["/admin/calendar", "17_admin_calendar.png"],
      ["/admin/invoices", "18_admin_invoices.png"],
      ["/admin/clients", "19_admin_clients.png"],
      ["/admin/agents", "20_admin_agents.png"],
      ["/admin/employees", "21_admin_employees.png"],
      ["/admin/payroll", "22_admin_payroll.png"],
      ["/admin/team", "23_admin_team.png"],
      ["/admin/tools", "24_admin_email_tools.png"],
      ["/admin/emails", "25_admin_email_dashboard.png"],
      ["/admin/settings", "26_admin_settings.png"],
      ["/admin/webmaster", "27_admin_webmaster.png"],
    ];
    for (const [path, file] of adminRoutes) {
      await goto(page, path);
      await shot(page, file);
    }
    await ctx.close();
  }

  console.log("\nAdmin phone application");
  {
    const ctx = await browser.newContext({
      viewport: mobile,
      isMobile: true,
      hasTouch: true,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile Safari/604.1",
    });
    const page = await ctx.newPage();
    await goto(page, "/admin/login");
    await login(page, "admin");
    await shot(page, "30_mobile_admin_dashboard.png");
    const menu = page.locator('button[aria-label*="menu"], button:has-text("Menu")').first();
    if (await menu.isVisible({ timeout: 1500 }).catch(() => false)) {
      await menu.click();
      await sleep(500);
      await shot(page, "31_mobile_admin_menu.png");
    }
    await goto(page, "/admin/quote-requests");
    await shot(page, "32_mobile_admin_quote_requests.png");
    await goto(page, "/admin/quotes/new");
    await shot(page, "33_mobile_admin_quote_editor.png");
    await goto(page, "/admin/jobs");
    await shot(page, "34_mobile_admin_jobs.png");
    await goto(page, "/admin/calendar");
    await shot(page, "35_mobile_admin_calendar.png");
    await ctx.close();
  }

  console.log("\nAgent desktop portal");
  {
    const ctx = await browser.newContext({ viewport: desktop });
    const page = await ctx.newPage();
    await goto(page, "/agent/login");
    await shot(page, "40_agent_login.png");
    const signupButton = page.locator('button:has-text("Sign Up")').first();
    if (await signupButton.isVisible({ timeout: 1500 }).catch(() => false)) {
      await signupButton.click();
      await sleep(500);
      await shot(page, "41_agent_signup.png");
      const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In")').first();
      if (await loginButton.isVisible({ timeout: 1500 }).catch(() => false)) await loginButton.click();
    }
    await login(page, "agent");
    await shot(page, "42_agent_dashboard.png");
    const agentRoutes = [
      ["/agent/request", "43_agent_request.png"],
      ["/agent/jobs", "44_agent_jobs.png"],
      ["/agent/gallery", "45_agent_gallery.png"],
      ["/agent/contact", "46_agent_contact.png"],
    ];
    for (const [path, file] of agentRoutes) {
      await goto(page, path);
      await shot(page, file);
    }
    await ctx.close();
  }

  console.log("\nAgent phone application");
  {
    const ctx = await browser.newContext({
      viewport: mobile,
      isMobile: true,
      hasTouch: true,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile Safari/604.1",
    });
    const page = await ctx.newPage();
    await goto(page, "/");
    await shot(page, "50_mobile_landing.png");
    await goto(page, "/agent/login");
    await login(page, "agent");
    await shot(page, "51_mobile_agent_dashboard.png");
    await goto(page, "/agent/request");
    await shot(page, "52_mobile_agent_request.png");
    await goto(page, "/agent/jobs");
    await shot(page, "53_mobile_agent_jobs.png");
    await goto(page, "/agent/gallery");
    await shot(page, "54_mobile_agent_gallery.png");
    await goto(page, "/agent/contact");
    await shot(page, "55_mobile_agent_contact.png");
    await ctx.close();
  }

  await browser.close();
}

function imageUrl(filename) {
  const path = resolve(OUT_DIR, filename);
  return existsSync(path) ? pathToFileURL(path).href : "";
}

function assetUrl(path) {
  return existsSync(path) ? pathToFileURL(path).href : "";
}

function page(title, eyebrow, body, screenshot, note = "") {
  const image = imageUrl(screenshot);
  return `
    <section class="page content">
      <div class="eyebrow">${eyebrow}</div>
      <h1>${title}</h1>
      <div class="body">${body}</div>
      ${image ? `<figure><img src="${image}" /><figcaption>Fresh screenshot captured from the upgraded site: ${screenshot}</figcaption></figure>` : `<div class="missing">Screenshot missing: ${screenshot}</div>`}
      ${note ? `<div class="note">${note}</div>` : ""}
    </section>`;
}

function divider(number, title, subtitle) {
  return `
    <section class="page divider">
      <div class="divider-inner">
        <div class="chapter-number">${number}</div>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>
    </section>`;
}

function bullets(items) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function buildHtml() {
  const logo = assetUrl(resolve(ROOT, "src/assets/mayura-logo-horizontal.png"));
  const cover = imageUrl("01_landing_hero.png");
  const date = new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" });

  const pages = [
    `<section class="page cover">
      ${cover ? `<img class="cover-photo" src="${cover}" />` : ""}
      <div class="cover-shade"></div>
      <div class="cover-content">
        ${logo ? `<img class="logo" src="${logo}" />` : ""}
        <div>
          <div class="cover-kicker">Current Site Tour</div>
          <h1>Mayura Garden Services<br/>Website & Phone App Guide</h1>
          <p>Landing page, Admin access and Agent access documented from fresh upgraded-site screenshots.</p>
        </div>
        <div class="cover-meta">Prepared for Mayura Garden Services<br/>Generated ${date}<br/>60 pages including front and back cover</div>
      </div>
    </section>`,
    `<section class="page toc">
      <h1>How To Use This Document</h1>
      <p>This guide is a practical site tour. Each access level has its own section, with desktop website instructions followed by phone application instructions where the same workflow is used on mobile.</p>
      <div class="toc-grid">
        <div><strong>1</strong><span>Landing Page</span><em>Public website, quote form, language support and mobile landing experience.</em></div>
        <div><strong>2a</strong><span>Admin Website</span><em>Back-office dashboard, quotes, jobs, invoices, clients, team, payroll and settings.</em></div>
        <div><strong>2b</strong><span>Admin Phone Application</span><em>Mobile menu, dashboard, quote requests, quote editing, jobs and calendar use.</em></div>
        <div><strong>3a</strong><span>Agent Website</span><em>Agent registration, login, referral requests, jobs, gallery and contact features.</em></div>
        <div><strong>3b</strong><span>Agent Phone Application</span><em>Phone workflow for agents submitting and tracking referrals.</em></div>
      </div>
      <div class="note">Screenshots were regenerated into <strong>scripts/current-tour-screenshots</strong> for this version. Older documentation screenshots were not reused.</div>
    </section>`,
    `<section class="page content no-shot">
      <div class="eyebrow">Verification</div>
      <h1>Current Upgrade Check</h1>
      <p>The current route map was checked from <strong>src/App.tsx</strong> before this document was generated. The visible admin navigation now uses a top navigation with dropdown groups on desktop and a compact mobile menu plus bottom navigation on phones.</p>
      ${bullets([
        "Public access: landing page, quote request form, before/after gallery, social sharing and language toggle.",
        "Admin access: dashboard, quote requests, quote builder, materials, packages, jobs, calendar, invoices, clients, agents, employees, payroll, team roles, email tools, email dashboard, settings and webmaster console where permitted.",
        "Agent access: dashboard, new referral request, jobs, gallery, contact details and password management.",
        "Mobile access: touch-friendly layouts with persistent bottom navigation for portal areas."
      ])}
      <div class="note">Where a feature requires a signed-in role, the screenshots were taken after signing into that role, not from public placeholder pages.</div>
    </section>`,
    `<section class="page content no-shot">
      <div class="eyebrow">Access Levels</div>
      <h1>Who Uses Which Area</h1>
      <p>The upgraded system separates users by role so each person sees the tools they need without exposing unnecessary management controls.</p>
      ${bullets([
        "<strong>Landing Page:</strong> used by prospective clients to learn about services, view transformations and submit a quote request.",
        "<strong>Admin Website:</strong> used by Mayura staff and managers to run the quoting, job, invoicing, client and team workflows.",
        "<strong>Admin Phone Application:</strong> used by the same admin team when working away from a desk.",
        "<strong>Agent Website:</strong> used by approved real estate agents and partners to submit referred quote requests and track their work.",
        "<strong>Agent Phone Application:</strong> used by agents in the field when a fast request or job check is needed."
      ])}
    </section>`,
    divider("1", "Landing Page", "Public website experience for visitors, clients and referral leads."),
    page("Homepage Hero", "Landing Page", `<p>The first screen introduces Mayura Garden Services and gives visitors immediate ways to request a quote or move through the public site.</p>${bullets(["Use the top navigation to jump through the public sections.", "Use the main call-to-action to move directly to the quote request form.", "Use the language toggle when a Chinese-language client experience is needed."])}`, "01_landing_hero.png"),
    page("Services Overview", "Landing Page", `<p>The services section explains what Mayura offers in plain language so visitors can match their garden need to the right type of work.</p>${bullets(["Scan the service cards to understand available work types.", "Use this section during client calls to point people toward the right request category."])}`, "02_landing_services.png"),
    page("Before & After Gallery", "Landing Page", `<p>The gallery demonstrates visual outcomes from completed work. It is useful for prospects who want evidence of transformation quality before requesting a quote.</p>${bullets(["Review before and after examples with the client.", "Use gallery examples to clarify the expected standard of finish."])}`, "03_landing_gallery.png"),
    page("Social Sharing", "Landing Page", `<p>The sharing section gives visitors and partners simple ways to pass the website to someone else.</p>${bullets(["Choose the relevant share channel.", "Use WeChat where Chinese-speaking contacts prefer QR or WeChat sharing.", "Email sharing opens a pre-filled message from the visitor's email client."])}`, "04_landing_social.png"),
    page("Quote Request Form", "Landing Page", `<p>The public quote form is the main lead-capture process. It collects contact details, property information, requested service details and supporting photos.</p>${bullets(["Enter the client's name, contact details and property address.", "Choose the service type and preferred timing.", "Upload photos where available so admin can assess the garden before quoting.", "Submit the request so it enters the admin quote request workflow."])}`, "05_landing_quote_form.png"),
    page("Full Public Page", "Landing Page", `<p>This full-page screenshot confirms the public site flow from hero, services and gallery through to contact and quote capture.</p>${bullets(["Use it as a quick visual map of the public site.", "When updating public content, check that the section order still supports quote conversion."])}`, "06_landing_full_page.png"),
    page("Chinese Language View", "Landing Page", `<p>The upgraded landing page includes a language toggle for Chinese-language public content.</p>${bullets(["Select the language button in the header.", "Review headings, service copy and form labels after switching language.", "Switch back to English using the same control."])}`, "07_landing_chinese.png"),
    page("Mobile Landing Page", "Landing Page", `<p>On phones, the landing page stacks content into a touch-friendly format and keeps the main quote path available.</p>${bullets(["Open the website on a phone or mobile browser.", "Scroll vertically through services, gallery and quote form sections.", "Use mobile-native keyboard and date controls in the quote form."])}`, "50_mobile_landing.png"),
    page("Landing Page Operating Notes", "Landing Page", `<p>The public page is designed to convert visitors into quote requests while also supporting referral partners and Chinese-speaking users.</p>${bullets(["Keep gallery images current, clear and relevant to pre-sale garden presentation.", "Check the quote form after any field or email workflow change.", "Use the public page as the starting point for new client enquiries."])}`, "01_landing_hero.png"),
    page("Landing Page Handover Checklist", "Landing Page", `<p>Use this checklist after future content or design updates.</p>${bullets(["Hero loads with Mayura branding and clear quote call-to-action.", "Service cards are readable on desktop and phone.", "Gallery images are not cropped awkwardly.", "Quote form submits into the admin workflow.", "Language toggle still switches the public content cleanly."])}`, "05_landing_quote_form.png"),
    page("Public Access Summary", "Landing Page", `<p>The landing page is the only area available without signing in. Its purpose is to explain the offer, build trust and send complete request information to admin.</p>`, "06_landing_full_page.png"),
    divider("2a", "Admin Website", "Desktop back-office workflow for Mayura staff, managers and webmaster users."),
    page("Admin Login", "Admin Website", `<p>Admin users start at the secure admin login screen.</p>${bullets(["Enter the approved admin email address.", "Enter the password and sign in.", "If access is not granted, the user is returned to the login page until the role is corrected."])}`, "10_admin_login.png"),
    page("Admin Dashboard", "Admin Website", `<p>The dashboard is the daily command centre for the business. It gives a fast read on quotes, jobs, revenue and activity.</p>${bullets(["Review KPI cards at the start of the day.", "Use the top navigation to move into quote, job, client and settings areas.", "Use the notification bell for recent activity alerts."])}`, "11_admin_dashboard.png"),
    page("Quote Requests", "Admin Website", `<p>Incoming public and agent quote requests are reviewed here before they become formal quotes or jobs.</p>${bullets(["Open new requests from the list.", "Check client details, property information and uploaded photos.", "Update the request status as it is reviewed or converted."])}`, "12_admin_quote_requests.png"),
    page("New Quote Builder", "Admin Website", `<p>The quote builder creates formal client quotes with client details, services, materials and pricing.</p>${bullets(["Add or confirm the client details.", "Add line items for labour, materials or service packages.", "Review totals before saving, previewing or sending the quote."])}`, "13_admin_quote_editor.png"),
    page("Materials Catalogue", "Admin Website", `<p>The materials area keeps reusable product and cost information available for quotes.</p>${bullets(["Search or filter the catalogue.", "Add materials that are commonly used in quotes.", "Use supplier search tools where current supplier pricing needs to be checked."])}`, "14_admin_materials.png"),
    page("Service Packages", "Admin Website", `<p>Packages speed up quoting by grouping common services or line items into reusable bundles.</p>${bullets(["Create packages for repeat garden service patterns.", "Use packages in quote creation to reduce manual entry.", "Update package prices when business pricing changes."])}`, "15_admin_packages.png"),
    page("Jobs List", "Admin Website", `<p>The jobs page tracks scheduled and in-progress work after quote approval.</p>${bullets(["Filter jobs by status.", "Open a job to review details, assigned people and progress.", "Keep job status updated so dashboard and calendar data remain accurate."])}`, "16_admin_jobs.png"),
    page("Calendar", "Admin Website", `<p>The calendar provides a schedule view for booked and planned work.</p>${bullets(["Move between dates to review upcoming work.", "Use the calendar to check availability before confirming dates.", "Open related job records for more detail."])}`, "17_admin_calendar.png"),
    page("Invoices", "Admin Website", `<p>The invoices page manages client billing and payment status.</p>${bullets(["Review invoice totals and due dates.", "Filter invoices by payment status.", "Open an invoice for details, PDF download or sending workflows."])}`, "18_admin_invoices.png"),
    page("Client List", "Admin Website", `<p>The client area keeps contact and property records in one place.</p>${bullets(["Search clients by name, email, phone or property details.", "Use client history when preparing a quote or resolving a payment query.", "Add new client records where needed."])}`, "19_admin_clients.png"),
    page("Agent Management", "Admin Website", `<p>Admins manage referral partners and their approval status from the agent management area.</p>${bullets(["Review new agent registrations.", "Approve, suspend or update agents as required.", "Check request counts and referral activity for each agent."])}`, "20_admin_agents.png"),
    page("Employees", "Admin Website", `<p>The employee section supports field-team administration.</p>${bullets(["Maintain employee records and active status.", "Use employee records when assigning work and tracking hours.", "Keep rates and details current for payroll accuracy."])}`, "21_admin_employees.png"),
    page("Payroll", "Admin Website", `<p>Payroll brings together hours, rates and pay-period information for employee payment review.</p>${bullets(["Select the relevant pay period.", "Review employee hours and calculated amounts.", "Use payroll figures alongside time logs before payment."])}`, "22_admin_payroll.png"),
    page("Team & Roles", "Admin Website", `<p>The team and roles area controls staff access levels across the system.</p>${bullets(["Review each team member's role.", "Grant only the access level needed for their work.", "Use role changes carefully because they affect admin visibility."])}`, "23_admin_team.png"),
    page("Email Tools", "Admin Website", `<p>Email tools help staff send consistent client communication from templates.</p>${bullets(["Choose the template for the client situation.", "Check recipient details and message wording.", "Preview before sending so business communication stays consistent."])}`, "24_admin_email_tools.png"),
    page("Email Dashboard", "Admin Website", `<p>The email dashboard shows email activity and delivery-related information.</p>${bullets(["Review recent email events.", "Use the dashboard to confirm important client messages were processed.", "Investigate failed or suppressed communication before resending."])}`, "25_admin_email_dashboard.png"),
    page("Settings", "Admin Website", `<p>Settings contain business configuration such as contact details, notification preferences and system defaults.</p>${bullets(["Update business details when Mayura contact information changes.", "Review notification settings after workflow changes.", "Keep quote and invoice defaults aligned with current business terms."])}`, "26_admin_settings.png"),
    page("Webmaster Console", "Admin Website", `<p>The webmaster console is available to permitted webmaster users for higher-level site administration.</p>${bullets(["Use only for site-level configuration or maintenance tasks.", "Keep access restricted to trusted users.", "Confirm changes carefully because webmaster controls can affect the wider site."])}`, "27_admin_webmaster.png"),
    page("Admin Desktop Navigation", "Admin Website", `<p>The upgraded admin desktop uses grouped top navigation rather than relying on old sidebar assumptions.</p>${bullets(["Use dropdown groups for quote, job, email and client workflows.", "Use the Password control when the signed-in admin needs to update their password.", "Use Logout when finished, especially on shared devices."])}`, "11_admin_dashboard.png"),
    page("Admin Website Daily Process", "Admin Website", `<p>A typical admin day starts with dashboard review, then moves through quote requests, scheduled jobs, invoices and communication follow-up.</p>${bullets(["Check new requests and notifications.", "Convert qualified requests into quotes.", "Update jobs and calendar dates.", "Review invoice/payment status.", "Send follow-up emails where required."])}`, "12_admin_quote_requests.png"),
    divider("2b", "Admin Phone Application", "Mobile admin workflow for field checks and quick updates."),
    page("Mobile Admin Dashboard", "Admin Phone Application", `<p>The phone dashboard keeps the same core business view available away from the desk.</p>${bullets(["Open the admin site on a phone.", "Sign in with admin credentials.", "Review dashboard cards and recent activity."])}`, "30_mobile_admin_dashboard.png"),
    page("Mobile Admin Menu", "Admin Phone Application", `<p>The phone menu exposes the same major admin areas in a compact touch layout.</p>${bullets(["Tap Menu in the mobile header.", "Choose the required admin area.", "Use Logout or Change Password from the same mobile menu when needed."])}`, "31_mobile_admin_menu.png"),
    page("Mobile Quote Requests", "Admin Phone Application", `<p>Quote requests can be reviewed quickly on mobile, which is useful when new leads arrive while staff are in the field.</p>${bullets(["Open Quote Requests from the mobile menu or bottom navigation.", "Review client and service details.", "Follow up or convert the request when enough information is available."])}`, "32_mobile_admin_quote_requests.png"),
    page("Mobile Quote Editor", "Admin Phone Application", `<p>The quote editor remains available on phone, with form fields and line items adjusted for the smaller screen.</p>${bullets(["Enter client and quote information using phone-friendly fields.", "Scroll through line items and totals carefully before sending.", "Use desktop for long or complex quote builds when possible."])}`, "33_mobile_admin_quote_editor.png"),
    page("Mobile Jobs", "Admin Phone Application", `<p>The mobile jobs view is useful for checking job status, value and schedule details while travelling or onsite.</p>${bullets(["Open Jobs from the bottom navigation.", "Review status badges and client/job summaries.", "Open job detail when more information is required."])}`, "34_mobile_admin_jobs.png"),
    page("Mobile Calendar", "Admin Phone Application", `<p>The phone calendar helps confirm schedule information without returning to a desktop.</p>${bullets(["Open Calendar from the mobile navigation.", "Review upcoming booked work.", "Use it when discussing dates with clients or staff."])}`, "35_mobile_admin_calendar.png"),
    page("Admin Phone Usage Notes", "Admin Phone Application", `<p>The phone application is best for quick checks and light updates. Complex quoting, payroll review and bulk data management are easier on desktop.</p>${bullets(["Use mobile for urgent request review, job checks and schedule lookups.", "Use desktop for detailed quote editing, payroll and team role changes.", "Always log out on shared or borrowed phones."])}`, "30_mobile_admin_dashboard.png"),
    divider("3a", "Agent Website", "Desktop referral portal for approved partner agents."),
    page("Agent Login", "Agent Website", `<p>Agents use the dedicated agent login rather than the admin portal.</p>${bullets(["Enter the approved agent email and password.", "Sign in to reach the agent dashboard.", "Use the password control after login when a password change is needed."])}`, "40_agent_login.png"),
    page("Agent Registration", "Agent Website", `<p>New agents can register from the sign-up tab. Their access must be approved before they can use the portal fully.</p>${bullets(["Enter agent name, agency, phone, email and password.", "Submit registration.", "Wait for admin approval before portal access is active."])}`, "41_agent_signup.png"),
    page("Agent Dashboard", "Agent Website", `<p>The agent dashboard summarises the partner's referral activity.</p>${bullets(["Review active and completed requests.", "Check recent referral submissions.", "Use the top navigation to create requests or review jobs."])}`, "42_agent_dashboard.png"),
    page("New Agent Request", "Agent Website", `<p>Agents submit new quote requests for prospective clients or properties from this page.</p>${bullets(["Enter client details and property address.", "Describe the requested garden work.", "Attach photos when available.", "Submit so Mayura admin can review and respond."])}`, "43_agent_request.png"),
    page("Agent Jobs", "Agent Website", `<p>Agents can track jobs associated with their submitted requests.</p>${bullets(["Review job status and key details.", "Use job information to keep property stakeholders informed.", "Contact Mayura if job information needs clarification."])}`, "44_agent_jobs.png"),
    page("Agent Gallery", "Agent Website", `<p>The gallery gives agents a portfolio reference when speaking with sellers or property managers.</p>${bullets(["Browse completed project photos.", "Use examples to explain the value of presentation gardening.", "Refer clients to public examples when discussing scope."])}`, "45_agent_gallery.png"),
    page("Agent Contact", "Agent Website", `<p>The contact page gives agents direct Mayura contact information and support paths.</p>${bullets(["Use contact details for urgent referral questions.", "Use WeChat details where appropriate.", "Keep this page handy when supporting a client conversation."])}`, "46_agent_contact.png"),
    divider("3b", "Agent Phone Application", "Mobile referral workflow for agents in the field."),
    page("Mobile Agent Dashboard", "Agent Phone Application", `<p>The phone dashboard gives agents a compact view of referral activity.</p>${bullets(["Open the agent portal on a phone.", "Sign in with approved agent details.", "Use the bottom navigation for Home, Request, Jobs, Gallery and Contact."])}`, "51_mobile_agent_dashboard.png"),
    page("Mobile Agent Request", "Agent Phone Application", `<p>Agents can submit requests while onsite or immediately after meeting a prospective client.</p>${bullets(["Enter client and address details.", "Use the phone camera or photo library to add garden images.", "Submit the request while the details are still fresh."])}`, "52_mobile_agent_request.png"),
    page("Mobile Agent Jobs", "Agent Phone Application", `<p>The mobile jobs view keeps referral progress accessible when agents are away from their desk.</p>${bullets(["Open Jobs from the bottom navigation.", "Check the status of referred work.", "Use Contact if an update is needed."])}`, "53_mobile_agent_jobs.png"),
    page("Mobile Agent Gallery", "Agent Phone Application", `<p>The phone gallery lets agents show examples during property conversations.</p>${bullets(["Open Gallery from the bottom navigation.", "Show before/after examples to prospects.", "Use examples to set expectations for garden presentation."])}`, "54_mobile_agent_gallery.png"),
    page("Mobile Agent Contact", "Agent Phone Application", `<p>The mobile contact page keeps Mayura details available for quick support.</p>${bullets(["Open Contact from the bottom navigation.", "Use phone, email or WeChat details as appropriate.", "Escalate time-sensitive quote or job questions directly."])}`, "55_mobile_agent_contact.png"),
    `<section class="page back">
      ${logo ? `<img class="back-logo" src="${logo}" />` : ""}
      <h1>Mayura Garden Services</h1>
      <p>Current Site Tour Guide</p>
    </section>`,
  ];

  if (pages.length !== 60) {
    throw new Error(`Document page plan must be 60 pages, got ${pages.length}`);
  }

  return `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Mayura Garden Services Current Site Tour</title>
    <style>
      @page { size: A4; margin: 0; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #20352c; background: white; }
      .page { width: 210mm; height: 297mm; page-break-after: always; position: relative; overflow: hidden; padding: 18mm; }
      .cover { background: #052a1d; color: white; padding: 24mm; }
      .cover-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .38; }
      .cover-shade { position: absolute; inset: 0; background: linear-gradient(100deg, rgba(5,42,29,.96), rgba(5,42,29,.66)); }
      .cover-content { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
      .logo { width: 74mm; background: rgba(255,255,255,.88); padding: 4mm; border-radius: 3mm; }
      .cover-kicker, .eyebrow, .chapter-number { color: #c8a951; text-transform: uppercase; letter-spacing: 2px; font-size: 8pt; font-weight: 700; }
      .cover h1 { font-family: Georgia, serif; font-size: 34pt; line-height: 1.12; margin: 8mm 0 5mm; }
      .cover p { max-width: 135mm; color: #f4ead1; font-size: 13pt; line-height: 1.5; }
      .cover-meta { color: rgba(255,255,255,.72); font-size: 9pt; line-height: 1.8; border-top: 1px solid rgba(255,255,255,.25); padding-top: 5mm; }
      .toc h1, .content h1 { font-family: Georgia, serif; color: #052a1d; font-size: 24pt; line-height: 1.15; margin: 4mm 0 5mm; }
      .toc p, .content p { font-size: 10.5pt; line-height: 1.55; color: #3f514a; }
      .toc-grid { display: grid; gap: 4mm; margin-top: 8mm; }
      .toc-grid div { border-left: 4px solid #c8a951; background: #f8f5ec; padding: 4mm 5mm; }
      .toc-grid strong { display: inline-block; width: 12mm; color: #0b4a35; font-size: 14pt; }
      .toc-grid span { font-weight: 700; color: #052a1d; font-size: 12pt; }
      .toc-grid em { display: block; margin-left: 13mm; color: #5d6b65; font-size: 9.5pt; font-style: normal; line-height: 1.45; }
      .divider { background: #052a1d; color: white; display: flex; align-items: center; }
      .divider-inner { max-width: 160mm; }
      .divider h1 { font-family: Georgia, serif; font-size: 36pt; line-height: 1.08; margin: 7mm 0; }
      .divider p { color: #e8d090; font-size: 14pt; line-height: 1.45; }
      .content { display: flex; flex-direction: column; }
      .body { flex: none; }
      ul { margin: 3mm 0 4mm 0; padding: 0; list-style: none; }
      li { position: relative; padding: 1.2mm 0 1.2mm 6mm; font-size: 9.5pt; line-height: 1.42; color: #3f514a; border-bottom: 1px solid rgba(200,169,81,.22); }
      li:before { content: ""; position: absolute; left: 0; top: 3mm; width: 2.2mm; height: 2.2mm; background: #c8a951; border-radius: 50%; }
      figure { margin: 4mm 0 0; border: 1px solid #d9cfb5; border-radius: 2mm; overflow: hidden; box-shadow: 0 2mm 7mm rgba(0,0,0,.12); background: #fff; }
      figure img { display: block; width: 100%; height: 137mm; object-fit: contain; background: #f7f5ef; }
      figcaption { padding: 2mm 3mm; font-size: 7.5pt; color: #6e766f; background: #fbfaf6; border-top: 1px solid #e4dcc8; }
      .no-shot { justify-content: flex-start; }
      .no-shot ul { margin-top: 8mm; }
      .note { margin-top: 5mm; padding: 4mm 5mm; background: #f8f5ec; border-left: 4px solid #c8a951; font-size: 9pt; line-height: 1.55; color: #40564d; }
      .missing { padding: 12mm; background: #fff4f4; border: 1px solid #eaa; color: #8a1111; }
      .back { background: #052a1d; color: #e8d090; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
      .back-logo { width: 82mm; background: rgba(255,255,255,.9); padding: 5mm; border-radius: 3mm; margin-bottom: 12mm; }
      .back h1 { font-family: Georgia, serif; color: white; font-size: 26pt; margin: 0 0 3mm; }
      .back p { color: #e8d090; font-size: 12pt; }
    </style>
  </head>
  <body>${pages.join("\n")}</body>
  </html>`;
}

async function generatePdf() {
  const html = buildHtml();
  const htmlPath = resolve(ROOT, "Mayura_Garden_Services_Current_Site_Tour.html");
  writeFileSync(htmlPath, html);
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle0" });
  await page.pdf({ path: OUT_PDF, format: "A4", printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  await browser.close();
  console.log(`\nPDF saved: ${OUT_PDF}`);
}

if (process.env.SKIP_CAPTURE !== "1") {
  await captureScreenshots();
}
await generatePdf();
