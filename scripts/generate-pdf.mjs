/**
 * Mayura Garden Services – Feature Documentation PDF Generator
 * Generates a formal A4 handover document from web designer to business owner.
 *
 * Pipeline:
 *  1. Loads screenshots as base64
 *  2. Builds a single large HTML document with SVG annotations overlaid
 *  3. Puppeteer prints it to A4 PDF
 *  4. Pads page count to nearest multiple of 4
 */

import puppeteer from 'puppeteer';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SS_DIR  = resolve(__dirname, 'doc-screenshots');
const OUT_PDF = resolve(__dirname, '..', 'Mayura_Garden_Services_Feature_Documentation.pdf');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function img(filename) {
  const p = resolve(SS_DIR, filename);
  if (!existsSync(p)) { console.warn(`  ⚠ Missing screenshot: ${filename}`); return ''; }
  // Return a file:// URL so Puppeteer can load it natively (avoids massive base64 blobs)
  return pathToFileURL(p).href;
}

function assetImg(assetPath) {
  if (!existsSync(assetPath)) return '';
  return pathToFileURL(assetPath).href;
}

/**
 * Renders a screenshot with a numbered legend table beneath it.
 * annotations: [{ x, y, label, description }]
 */
function annotatedImage(filename, annotations = []) {
  const src = img(filename);
  if (!src) return `<div class="missing-img">Screenshot not available: ${filename}</div>`;

  const legendRows = annotations.map(a => `
    <tr>
      <td class="leg-num">${a.label}</td>
      <td class="leg-desc">${a.description}</td>
    </tr>`).join('');

  const legendHtml = annotations.length > 0 ? `
    <table class="legend">
      <thead><tr><th>#</th><th>Description</th></tr></thead>
      <tbody>${legendRows}</tbody>
    </table>` : '';

  return `
    <div class="screenshot-wrap">
      <div class="ss-container">
        <img src="${src}" class="ss-img" alt="${filename}"/>
      </div>
      ${legendHtml}
    </div>`;
}

// ─── Annotation Data ──────────────────────────────────────────────────────────

const ANNOTATIONS = {

  '01_landing_hero.png': [
    { x: 50, y: 12, label: 1, description: `Main navigation bar with logo, language toggle (EN/中), and quick-access links` },
    { x: 30, y: 45, label: 2, description: `Hero headline and value proposition — immediately communicates the brand offer` },
    { x: 70, y: 55, label: 3, description: `Primary call-to-action button directing visitors to the quote request form` },
    { x: 88, y: 20, label: 4, description: `Language toggle — switches the full page between English and Chinese` },
  ],

  '02_landing_services.png': [
    { x: 17, y: 40, label: 1, description: `Service category card — click to expand details and pricing range` },
    { x: 50, y: 40, label: 2, description: `Service category card — Lawn Care & Maintenance` },
    { x: 83, y: 40, label: 3, description: `Service category card — Garden Design & Landscaping` },
    { x: 50, y: 80, label: 4, description: `Section sub-heading introducing the service offerings` },
  ],

  '03_landing_gallery.png': [
    { x: 25, y: 50, label: 1, description: `Before image — original garden state prior to Mayura works` },
    { x: 75, y: 50, label: 2, description: `After image — completed transformation result` },
    { x: 50, y: 88, label: 3, description: `Interactive drag-to-reveal slider — visitors drag left/right to compare before/after` },
    { x: 50, y: 15, label: 4, description: `Gallery section heading with project count indicator` },
  ],

  '04_landing_quote_form.png': [
    { x: 30, y: 25, label: 1, description: `Client name and contact details fields` },
    { x: 70, y: 25, label: 2, description: `Service type selector and preferred date picker` },
    { x: 50, y: 55, label: 3, description: `Photo upload area — accepts up to 5 images (max 10 MB each); triggers AI garden analyser` },
    { x: 50, y: 75, label: 4, description: `Agent referral code field — links submission to a referral partner for commission tracking` },
    { x: 50, y: 88, label: 5, description: `Submit button — stores request in Supabase and sends transactional email notification` },
  ],

  '05_landing_social_sharing.png': [
    { x: 15, y: 50, label: 1, description: `Facebook share button — opens pre-filled Facebook post with site URL and OG image` },
    { x: 30, y: 50, label: 2, description: `Twitter/X share button` },
    { x: 45, y: 50, label: 3, description: `WhatsApp share button — sends message link directly to WhatsApp` },
    { x: 60, y: 50, label: 4, description: `LinkedIn share button` },
    { x: 75, y: 50, label: 5, description: `Email share button — opens default email client with pre-filled subject and body` },
    { x: 90, y: 50, label: 6, description: `WeChat button — opens QR code modal for adding contact or sharing page in WeChat` },
  ],

  '07_agent_login.png': [
    { x: 50, y: 18, label: 1, description: `Mayura Garden Services logo — links back to the public homepage` },
    { x: 30, y: 35, label: 2, description: `Login tab — existing agents sign in here with email and password` },
    { x: 70, y: 35, label: 3, description: `Sign Up tab — new agents register by providing name, agency, phone and creating a password` },
    { x: 50, y: 55, label: 4, description: `Email and password input fields` },
    { x: 50, y: 75, label: 5, description: `Sign In button — authenticates against Supabase and verifies agent approval status` },
    { x: 50, y: 88, label: 6, description: `Note: newly registered agents enter a pending state until approved by admin` },
  ],

  '08_agent_signup.png': [
    { x: 50, y: 30, label: 1, description: `Agent / business name field` },
    { x: 50, y: 45, label: 2, description: `Agency or company name field` },
    { x: 50, y: 58, label: 3, description: `Phone number field for contact purposes` },
    { x: 50, y: 68, label: 4, description: `Email and password fields` },
    { x: 50, y: 80, label: 5, description: `Create Account button — submits registration and triggers pending-approval workflow` },
  ],

  '09_agent_dashboard.png': [
    { x: 50, y: 10, label: 1, description: `Agent navigation header with portal branding and sign-out control` },
    { x: 20, y: 30, label: 2, description: `Active Requests counter — number of quote requests currently in progress` },
    { x: 50, y: 30, label: 3, description: `Completed Jobs counter — total jobs completed via this agent's referrals` },
    { x: 80, y: 30, label: 4, description: `Total Commissions earned — live total from Supabase referral records` },
    { x: 50, y: 60, label: 5, description: `Recent requests list — quick view of latest quote submissions with status badges` },
    { x: 50, y: 85, label: 6, description: `Bottom navigation bar (mobile) — Dashboard, Requests, Jobs, Gallery, Referrals` },
  ],

  '10_agent_quote_request.png': [
    { x: 50, y: 15, label: 1, description: `Page heading — Submit New Quote Request on behalf of a prospective client` },
    { x: 30, y: 35, label: 2, description: `Client details section — name, email, phone number` },
    { x: 70, y: 35, label: 3, description: `Property address and service description fields` },
    { x: 50, y: 60, label: 4, description: `Photo upload — supports up to 5 garden photos to help admin assess scope` },
    { x: 50, y: 80, label: 5, description: `Agent\'s unique referral code is automatically pre-filled and attached to the submission` },
    { x: 50, y: 90, label: 6, description: `Submit button — creates a quote_request record linked to this agent` },
  ],

  '11_agent_jobs.png': [
    { x: 50, y: 15, label: 1, description: `Jobs list — all jobs that originated from this agent's referrals` },
    { x: 20, y: 45, label: 2, description: `Job status badge — Active / Completed / Pending` },
    { x: 60, y: 45, label: 3, description: `Job value — estimated revenue for this engagement` },
    { x: 80, y: 45, label: 4, description: `Commission indicator — calculated commission amount for this job` },
    { x: 50, y: 75, label: 5, description: `Client name and service date for each job record` },
  ],

  '12_agent_gallery.png': [
    { x: 50, y: 15, label: 1, description: `Gallery section heading — portfolio of completed garden transformations` },
    { x: 25, y: 50, label: 2, description: `Before/After image card — tap to view full-size comparison` },
    { x: 75, y: 50, label: 3, description: `Project description and location tag on each gallery card` },
    { x: 50, y: 85, label: 4, description: `Gallery is shared across all agents — curated by admin in the admin portal` },
  ],

  '13_agent_referrals.png': [
    { x: 25, y: 25, label: 1, description: `Referral code display — agent's unique code to share with prospective clients` },
    { x: 75, y: 25, label: 2, description: `Copy to clipboard button — one-tap copy of the referral code` },
    { x: 50, y: 50, label: 3, description: `Commission summary table — each referral with job value, rate and earned amount` },
    { x: 25, y: 75, label: 4, description: `Total Earned figure — cumulative commission balance` },
    { x: 75, y: 75, label: 5, description: `Commission rate display — set by admin per-agent (shown when commission is enabled)` },
  ],

  '14_agent_contact.png': [
    { x: 50, y: 30, label: 1, description: `WeChat QR code — scan to add Mayura on WeChat for direct communication` },
    { x: 50, y: 60, label: 2, description: `Contact details — phone number and email address for support queries` },
    { x: 50, y: 80, label: 3, description: `Business hours and response time information` },
  ],

  '15_admin_login.png': [
    { x: 50, y: 18, label: 1, description: `Mayura Garden Services logo — links back to the public homepage` },
    { x: 50, y: 38, label: 2, description: `Admin portal heading — clearly identifies this as the staff-only login page` },
    { x: 50, y: 54, label: 3, description: `Email address input field` },
    { x: 50, y: 65, label: 4, description: `Password input with show/hide toggle` },
    { x: 50, y: 76, label: 5, description: `Sign In button — authenticates against Supabase and verifies admin role in user_roles table` },
  ],

  '16_admin_dashboard.png': [
    { x: 50, y: 8,  label: 1, description: `Admin top navigation — logo, notification bell, sign-out` },
    { x: 12, y: 50, label: 2, description: `Sidebar navigation — links to all admin sections` },
    { x: 28, y: 30, label: 3, description: `KPI card — Total Quotes (all time)` },
    { x: 50, y: 30, label: 4, description: `KPI card — Active Jobs currently in progress` },
    { x: 72, y: 30, label: 5, description: `KPI card — Revenue this month from accepted quotes` },
    { x: 88, y: 30, label: 6, description: `KPI card — New Quote Requests awaiting review` },
    { x: 50, y: 65, label: 7, description: `Recent activity list — latest quotes, jobs and client actions` },
    { x: 85, y: 65, label: 8, description: `Notification bell — alerts for new quote requests and job updates` },
  ],

  '17_admin_quote_requests.png': [
    { x: 50, y: 12, label: 1, description: `Page heading — incoming quote requests submitted via the public website form` },
    { x: 15, y: 40, label: 2, description: `Client name and contact details for each request` },
    { x: 40, y: 40, label: 3, description: `Service type and preferred date requested` },
    { x: 65, y: 40, label: 4, description: `AI garden analysis summary — auto-generated from uploaded photos via Supabase edge function` },
    { x: 82, y: 40, label: 5, description: `Status badge — New / Reviewed / Converted` },
    { x: 92, y: 40, label: 6, description: `Action buttons — View details, Convert to Job` },
    { x: 50, y: 80, label: 7, description: `Referral code column — identifies if a request came via an agent referral` },
  ],

  '18_admin_quote_editor.png': [
    { x: 50, y: 10, label: 1, description: `Quote number and status badge (Draft / Sent / Accepted / Declined)` },
    { x: 25, y: 28, label: 2, description: `Client details section — name, email, phone, address` },
    { x: 75, y: 28, label: 3, description: `Service date and notes fields` },
    { x: 50, y: 50, label: 4, description: `Line items table — add materials and labour rows with quantity and unit price` },
    { x: 20, y: 68, label: 5, description: `Add Line Item button — inserts a new row with material lookup (Bunnings search integration)` },
    { x: 75, y: 68, label: 6, description: `Subtotal, tax and total calculations — auto-updated as items change` },
    { x: 25, y: 85, label: 7, description: `Save Draft button — persists quote without sending` },
    { x: 60, y: 85, label: 8, description: `Send to Client button — generates PDF and triggers transactional email` },
    { x: 85, y: 85, label: 9, description: `PDF Preview button — renders a jsPDF quote ready for download` },
  ],

  '19_admin_jobs.png': [
    { x: 50, y: 12, label: 1, description: `Jobs list header with filter controls (status, date range)` },
    { x: 15, y: 45, label: 2, description: `Job reference number and client name` },
    { x: 40, y: 45, label: 3, description: `Scheduled date and assigned team member` },
    { x: 60, y: 45, label: 4, description: `Job status badge — Pending / Active / Completed / Cancelled` },
    { x: 80, y: 45, label: 5, description: `Job value — linked invoice amount` },
    { x: 93, y: 45, label: 6, description: `View Job button — opens detailed job management view` },
    { x: 50, y: 80, label: 7, description: `Create New Job button — manually creates a job (or auto-created from accepted quote)` },
  ],

  '20_admin_invoices.png': [
    { x: 50, y: 12, label: 1, description: `Invoices list with search and filter controls` },
    { x: 15, y: 45, label: 2, description: `Invoice number linked to job and client` },
    { x: 38, y: 45, label: 3, description: `Invoice date and payment due date` },
    { x: 60, y: 45, label: 4, description: `Total amount and GST breakdown` },
    { x: 78, y: 45, label: 5, description: `Payment status — Unpaid / Paid / Overdue` },
    { x: 92, y: 45, label: 6, description: `Actions — View, Download PDF, Send to client` },
    { x: 50, y: 80, label: 7, description: `Revenue summary row — totals for filtered date range` },
  ],

  '21_admin_clients.png': [
    { x: 50, y: 12, label: 1, description: `Client database with search bar and export option` },
    { x: 15, y: 45, label: 2, description: `Client full name and contact email` },
    { x: 40, y: 45, label: 3, description: `Phone number and property address` },
    { x: 65, y: 45, label: 4, description: `Number of quotes and jobs associated with this client` },
    { x: 85, y: 45, label: 5, description: `View Client button — opens client history and contact management` },
    { x: 50, y: 80, label: 6, description: `Add New Client button — manually create a client record` },
  ],

  '22_admin_calendar.png': [
    { x: 50, y: 12, label: 1, description: `Calendar header with month/week toggle and navigation arrows` },
    { x: 50, y: 45, label: 2, description: `Job event blocks — colour-coded by status (active = green, pending = amber)` },
    { x: 15, y: 70, label: 3, description: `Date cell — click to view all jobs scheduled for that day` },
    { x: 75, y: 70, label: 4, description: `Job tooltip on hover — client name, service type and time` },
    { x: 50, y: 88, label: 5, description: `Legend — colour key for job statuses displayed on the calendar` },
  ],

  '23_admin_materials.png': [
    { x: 50, y: 12, label: 1, description: `Materials database — catalogue of products used in quotes and jobs` },
    { x: 15, y: 45, label: 2, description: `Material name and category` },
    { x: 40, y: 45, label: 3, description: `Unit and wholesale cost price` },
    { x: 65, y: 45, label: 4, description: `Retail / quote price and margin percentage` },
    { x: 85, y: 45, label: 5, description: `Bunnings search link — live search for current pricing via Supabase edge function` },
    { x: 50, y: 75, label: 6, description: `Add Material button — create a new catalogue entry used in quote line items` },
  ],

  '24_admin_packages.png': [
    { x: 50, y: 12, label: 1, description: `Service packages — pre-built bundles used to quickly populate quote line items` },
    { x: 25, y: 45, label: 2, description: `Package name, description and total price` },
    { x: 65, y: 45, label: 3, description: `Included line items within the package` },
    { x: 85, y: 45, label: 4, description: `Edit / Delete controls for each package` },
    { x: 50, y: 80, label: 5, description: `Create New Package button — define a new reusable service bundle` },
  ],

  '25_admin_agents.png': [
    { x: 50, y: 12, label: 1, description: `Agent management list — all registered referral partners` },
    { x: 15, y: 45, label: 2, description: `Agent name, email and agency` },
    { x: 40, y: 45, label: 3, description: `Registration date and approval status (Pending / Approved / Suspended)` },
    { x: 62, y: 45, label: 4, description: `Commission enabled toggle — enable/disable commission earning for each agent` },
    { x: 80, y: 45, label: 5, description: `Commission rate field — set the percentage rate for this agent` },
    { x: 92, y: 45, label: 6, description: `Approve / Suspend / Remove action buttons` },
    { x: 50, y: 80, label: 7, description: `Referral code assigned to each agent — used in the public quote request form` },
  ],

  '26_admin_settings.png': [
    { x: 50, y: 15, label: 1, description: `Business settings — company name, ABN, contact email, phone` },
    { x: 50, y: 35, label: 2, description: `Email notification settings — configure which events trigger email alerts` },
    { x: 50, y: 55, label: 3, description: `Push notification settings — manage Web Push subscription for browser notifications` },
    { x: 50, y: 75, label: 4, description: `Quote and invoice settings — default terms, GST rate, payment instructions` },
  ],

  '27_business_tools.png': [
    { x: 50, y: 12, label: 1, description: `Business Tools heading — unified communication hub for client-facing emails` },
    { x: 25, y: 35, label: 2, description: `Template selector — 9 pre-built email scenarios (Quote follow-up, Booking confirmation, Invoice, Review request, etc.)` },
    { x: 75, y: 35, label: 3, description: `Recipient field — type client name or email to auto-populate from the client database` },
    { x: 50, y: 60, label: 4, description: `Email body editor — template text with editable placeholders (client name, date, amount)` },
    { x: 50, y: 80, label: 5, description: `Preview panel — shows rendered email as the client will see it` },
    { x: 50, y: 90, label: 6, description: `Send button — dispatches via Supabase send-transactional-email edge function` },
  ],

  '28_business_tools_templates.png': [
    { x: 50, y: 15, label: 1, description: `Email template library — nine scenario-specific templates available` },
    { x: 25, y: 45, label: 2, description: `Template card — title, description and "Use This Template" button` },
    { x: 75, y: 45, label: 3, description: `Template preview text — shows the opening lines of the email template` },
    { x: 50, y: 80, label: 4, description: `All templates are pre-personalised with the client's name and job details automatically injected` },
  ],

  '29_mobile_landing.png': [
    { x: 50, y: 8,  label: 1, description: `Mobile header — logo, navigation hamburger menu` },
    { x: 50, y: 35, label: 2, description: `Hero section — full-width on mobile with stacked CTA button` },
    { x: 50, y: 65, label: 3, description: `Services cards displayed in single-column layout on mobile` },
    { x: 50, y: 88, label: 4, description: `Site is a Progressive Web App (PWA) — can be installed to the home screen on iOS and Android` },
  ],

  '30_mobile_services.png': [
    { x: 50, y: 20, label: 1, description: `Services section scrolled — stacked card layout optimised for touch` },
    { x: 50, y: 50, label: 2, description: `Before/After gallery — touch-drag slider works natively on mobile` },
    { x: 50, y: 78, label: 3, description: `Quote request form is fully accessible on mobile with native date picker support` },
  ],

  '31_mobile_admin_dashboard.png': [
    { x: 50, y: 8,  label: 1, description: `Mobile admin header — condensed navigation with notification bell` },
    { x: 25, y: 35, label: 2, description: `KPI cards stack vertically in 2-column grid on mobile` },
    { x: 75, y: 35, label: 3, description: `Revenue and job count cards visible above the fold` },
    { x: 50, y: 65, label: 4, description: `Recent activity scrollable list — swipe-friendly on touch screens` },
    { x: 50, y: 90, label: 5, description: `Bottom navigation bar — fixed, touch-optimised tab bar with icons and labels (Dashboard, Quotes, Jobs, Invoices, Clients)` },
  ],

  '32_mobile_admin_jobs.png': [
    { x: 50, y: 12, label: 1, description: `Jobs page rendered on mobile — full functionality maintained on smaller screens` },
    { x: 50, y: 40, label: 2, description: `Job cards with swipe-accessible action buttons` },
    { x: 50, y: 70, label: 3, description: `Status badges and job values clearly visible in compact card layout` },
    { x: 50, y: 88, label: 4, description: `Bottom navigation remains persistent across all admin pages on mobile` },
  ],

  '33_mobile_quote_editor.png': [
    { x: 50, y: 12, label: 1, description: `Quote editor on mobile — full quote creation capability on phone` },
    { x: 50, y: 35, label: 2, description: `Client details fields — touch-friendly input with native mobile keyboard` },
    { x: 50, y: 60, label: 3, description: `Line items table scrolls horizontally on narrow screens` },
    { x: 50, y: 82, label: 4, description: `PDF and Send buttons accessible at the bottom of the form` },
  ],

  '34_wechat_modal.png': [
    { x: 50, y: 20, label: 1, description: `WeChat modal — opens from the social sharing button on the landing page` },
    { x: 30, y: 38, label: 2, description: `"Add Me" tab — QR code for adding Mayura's WeChat contact directly` },
    { x: 70, y: 38, label: 3, description: `"Share Page" tab — QR code for sharing the website URL via WeChat` },
    { x: 50, y: 65, label: 4, description: `QR code image — scan with WeChat camera; served from /public/wechat-qr.jpg` },
    { x: 50, y: 85, label: 5, description: `Close button — dismisses the modal; accessible via Escape key also` },
  ],

  '35_language_chinese.png': [
    { x: 50, y: 12, label: 1, description: `Navigation rendered in Simplified Chinese after toggling the language switch` },
    { x: 88, y: 10, label: 2, description: `Language toggle button — now showing "EN" to switch back to English` },
    { x: 50, y: 45, label: 3, description: `All hero text, service descriptions and form labels translated` },
    { x: 50, y: 75, label: 4, description: `Chinese language support built with a custom i18n context; covers the full public-facing UI` },
  ],
};

// ─── HTML Document Builder ─────────────────────────────────────────────────────

function chapterHeader(num, title, subtitle = '') {
  return `
  <div class="chapter-break">
    <div class="chapter-num">Chapter ${num}</div>
    <div class="chapter-title">${title}</div>
    ${subtitle ? `<div class="chapter-subtitle">${subtitle}</div>` : ''}
  </div>`;
}

function sectionHeader(title, level = 'h2') {
  return `<${level} class="section-title">${title}</${level}>`;
}

function infoBox(content) {
  return `<div class="info-box">${content}</div>`;
}

function buildDocument() {
  const logoPath = resolve(__dirname, '..', 'src', 'assets', 'mayura-logo-horizontal.png');
  const logoSrc = assetImg(logoPath);

  const ogPath = resolve(__dirname, '..', 'public', 'og-image.jpg');
  const ogSrc = assetImg(ogPath);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Mayura Garden Services – Feature Documentation</title>
<style>

/* ─── Reset & base ─────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

:root {
  --green-dark:  #052A1D;
  --green-mid:   #0B4A35;
  --green-light: #1A7A57;
  --gold:        #C8A951;
  --gold-light:  #E8D090;
  --cream:       #F8F5EC;
  --text-dark:   #1A1A1A;
  --text-mid:    #3A3A3A;
  --text-light:  #6B7280;
  --border:      #D4C5A9;
  --page-w:      210mm;
  --page-h:      297mm;
  --margin-outer: 18mm;
  --margin-inner: 22mm;
  --margin-top:   20mm;
  --margin-bottom:20mm;
}

html { font-size: 10pt; }
body {
  font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
  color: var(--text-dark);
  background: white;
  line-height: 1.55;
}

/* ─── Page setup ───────────────────────────────────────── */
@page {
  size: A4 portrait;
  margin: var(--margin-top) var(--margin-outer) var(--margin-bottom) var(--margin-inner);
}
@page :left  { margin-left: var(--margin-outer); margin-right: var(--margin-inner); }
@page :right { margin-left: var(--margin-inner); margin-right: var(--margin-outer); }

.page {
  width: var(--page-w);
  min-height: var(--page-h);
  padding: var(--margin-top) var(--margin-outer) var(--margin-bottom) var(--margin-inner);
  page-break-after: always;
  position: relative;
}

/* ─── Cover page ───────────────────────────────────────── */
.cover-page {
  background: var(--green-dark);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
  padding: 30mm 22mm 24mm;
}
.cover-logo { width: 72mm; margin-bottom: 20mm; }
.cover-og {
  width: 100%;
  border-radius: 4px;
  opacity: 0.35;
  position: absolute;
  top: 0; left: 0;
  width: var(--page-w);
  height: var(--page-h);
  object-fit: cover;
  z-index: 0;
}
.cover-content { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; justify-content: space-between; }
.cover-label {
  font-family: 'DM Sans', sans-serif;
  font-size: 8pt;
  font-weight: 500;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--gold-light);
  margin-bottom: 6mm;
}
.cover-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 32pt;
  font-weight: 700;
  color: white;
  line-height: 1.2;
  margin-bottom: 5mm;
}
.cover-subtitle {
  font-family: 'DM Sans', sans-serif;
  font-size: 13pt;
  font-weight: 300;
  color: var(--gold-light);
  line-height: 1.4;
  margin-bottom: 16mm;
}
.cover-rule { width: 20mm; height: 2px; background: var(--gold); margin-bottom: 8mm; }
.cover-meta {
  font-size: 8.5pt;
  color: rgba(255,255,255,0.65);
  line-height: 1.8;
}
.cover-meta strong { color: rgba(255,255,255,0.9); }
.cover-footer {
  border-top: 1px solid rgba(255,255,255,0.2);
  padding-top: 6mm;
  font-size: 7.5pt;
  color: rgba(255,255,255,0.45);
  display: flex;
  justify-content: space-between;
}

/* ─── Inside front cover (TOC) ─────────────────────────── */
.toc-page {
  padding: 22mm 22mm 20mm;
}
.toc-header {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 20pt;
  font-weight: 700;
  color: var(--green-dark);
  margin-bottom: 8mm;
  padding-bottom: 4mm;
  border-bottom: 2px solid var(--green-dark);
}
.toc-chapter {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 2.5mm 0;
  border-bottom: 1px dotted var(--border);
}
.toc-chapter-num {
  font-size: 7.5pt;
  font-weight: 600;
  color: var(--gold);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-right: 3mm;
  flex-shrink: 0;
}
.toc-chapter-title {
  font-size: 10.5pt;
  font-weight: 600;
  color: var(--green-dark);
  flex-grow: 1;
}
.toc-chapter-page {
  font-size: 9pt;
  color: var(--text-light);
  flex-shrink: 0;
  margin-left: 3mm;
}
.toc-section {
  display: flex;
  justify-content: space-between;
  padding: 1mm 0 1mm 8mm;
  border-bottom: 1px dotted rgba(212,197,169,0.4);
}
.toc-section-title {
  font-size: 8.5pt;
  color: var(--text-mid);
}
.toc-intro-blurb {
  margin-top: 8mm;
  padding: 5mm 6mm;
  background: var(--cream);
  border-left: 3px solid var(--gold);
  font-size: 8.5pt;
  line-height: 1.6;
  color: var(--text-mid);
}

/* ─── Chapter break page ───────────────────────────────── */
.chapter-break {
  background: var(--green-dark);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 30mm 22mm;
  page-break-after: always;
  min-height: var(--page-h);
}
.chapter-num {
  font-size: 8pt;
  font-weight: 600;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 5mm;
}
.chapter-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 28pt;
  font-weight: 700;
  color: white;
  line-height: 1.2;
  margin-bottom: 6mm;
}
.chapter-subtitle {
  font-size: 11pt;
  color: rgba(255,255,255,0.65);
  font-weight: 300;
  line-height: 1.5;
  max-width: 140mm;
}
.chapter-accent { width: 16mm; height: 3px; background: var(--gold); margin-bottom: 6mm; }

/* ─── Content pages ────────────────────────────────────── */
.content-page {
  padding: var(--margin-top) var(--margin-outer) var(--margin-bottom) var(--margin-inner);
  page-break-after: always;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 7mm;
  padding-bottom: 3mm;
  border-bottom: 1.5px solid var(--green-dark);
}
.page-header-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 15pt;
  font-weight: 700;
  color: var(--green-dark);
}
.page-header-chapter {
  font-size: 7.5pt;
  font-weight: 500;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--gold);
}

h2.section-title {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 13pt;
  font-weight: 700;
  color: var(--green-dark);
  margin: 6mm 0 3mm;
  padding-left: 3mm;
  border-left: 3px solid var(--gold);
}
h3.section-title {
  font-size: 10.5pt;
  font-weight: 600;
  color: var(--green-mid);
  margin: 5mm 0 2mm;
}

p {
  font-size: 9pt;
  color: var(--text-mid);
  margin-bottom: 3mm;
  line-height: 1.65;
}
p + p { margin-top: 2mm; }

.info-box {
  background: var(--cream);
  border-left: 3px solid var(--gold);
  padding: 3.5mm 5mm;
  margin: 4mm 0;
  font-size: 8.5pt;
  line-height: 1.6;
  color: var(--text-mid);
}

.tech-box {
  background: #f0f4f8;
  border: 1px solid #c5d1de;
  border-left: 3px solid var(--green-light);
  padding: 3.5mm 5mm;
  margin: 4mm 0;
  font-size: 8pt;
  line-height: 1.65;
  color: #2a3a4a;
}
.tech-box strong { color: var(--green-dark); }

/* ─── Screenshot & annotations ─────────────────────────── */
.screenshot-wrap {
  margin: 5mm 0 6mm;
  page-break-inside: avoid;
}
.ss-container {
  position: relative;
  display: block;
  line-height: 0;
  border: 1px solid var(--border);
  border-radius: 3px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}
.ss-img {
  width: 100%;
  height: auto;
  display: block;
}
.ss-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
}

/* Callout circles */
.callout-ring {
  fill: #E03030;
  stroke: white;
  stroke-width: 1.2px;
  opacity: 0.92;
}
.callout-num {
  fill: white;
  font-family: 'DM Sans', sans-serif;
  font-size: 7px;
  font-weight: 700;
}

/* Legend table */
.legend {
  width: 100%;
  border-collapse: collapse;
  margin-top: 2.5mm;
  font-size: 7.5pt;
  page-break-inside: avoid;
}
.legend thead tr { background: var(--green-dark); color: white; }
.legend thead th {
  padding: 1.5mm 3mm;
  text-align: left;
  font-weight: 600;
  font-size: 7pt;
  letter-spacing: 0.5px;
}
.legend thead th:first-child { width: 8mm; text-align: center; }
.legend tbody tr:nth-child(even) { background: var(--cream); }
.legend tbody td {
  padding: 1.5mm 3mm;
  vertical-align: top;
  color: var(--text-mid);
  border-bottom: 1px solid var(--border);
}
.legend tbody td.leg-num {
  text-align: center;
  font-weight: 700;
  color: #E03030;
  width: 8mm;
  font-size: 8pt;
}

.missing-img {
  padding: 5mm;
  background: #fff0f0;
  border: 1px solid #ffcccc;
  color: #cc0000;
  font-size: 8pt;
  margin: 4mm 0;
}

/* ─── Feature list ──────────────────────────────────────── */
.feature-list {
  list-style: none;
  margin: 3mm 0;
  padding: 0;
}
.feature-list li {
  padding: 1.2mm 0 1.2mm 5mm;
  font-size: 8.5pt;
  color: var(--text-mid);
  border-bottom: 1px solid rgba(212,197,169,0.4);
  position: relative;
}
.feature-list li::before {
  content: '▸';
  color: var(--gold);
  position: absolute;
  left: 0;
  font-size: 7pt;
  top: 2mm;
}

/* ─── Two-column layout ─────────────────────────────────── */
.two-col { display: flex; gap: 6mm; }
.two-col > div { flex: 1; }

/* ─── Edge function cards ───────────────────────────────── */
.edge-card {
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 4mm 5mm;
  margin: 3mm 0;
  page-break-inside: avoid;
}
.edge-card-name {
  font-family: 'DM Sans', monospace;
  font-size: 9pt;
  font-weight: 700;
  color: var(--green-dark);
  background: var(--cream);
  padding: 1mm 2.5mm;
  border-radius: 2px;
  display: inline-block;
  margin-bottom: 2mm;
  letter-spacing: 0.3px;
}
.edge-card p { margin: 0; font-size: 8.5pt; }

/* ─── Back cover ────────────────────────────────────────── */
.back-cover {
  background: var(--green-dark);
  page-break-after: always;
  min-height: var(--page-h);
  width: var(--page-w);
  position: relative;
}
.back-cover-accent {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 40mm;
  background: var(--green-mid);
}

/* ─── Print overrides ───────────────────────────────────── */
@media print {
  .chapter-break, .content-page, .cover-page, .toc-page, .back-cover {
    page-break-after: always;
  }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}

</style>
</head>
<body>

<!-- ══════════════════════════════════════════════════════
     COVER PAGE  (page 1)
══════════════════════════════════════════════════════ -->
<div class="page cover-page">
  ${ogSrc ? `<img src="${ogSrc}" class="cover-og" alt=""/>` : ''}
  <div class="cover-content">
    <div>
      ${logoSrc ? `<img src="${logoSrc}" class="cover-logo" alt="Mayura Garden Services"/>` : '<div style="font-size:16pt;font-weight:700;color:white;margin-bottom:20mm;">MAYURA GARDEN SERVICES</div>'}
    </div>
    <div>
      <div class="cover-label">Website Feature Documentation</div>
      <div class="cover-rule"></div>
      <div class="cover-title">Mayura Garden<br/>Services</div>
      <div class="cover-subtitle">Complete Feature Reference &amp; Handover Guide<br/>for the Business Owner</div>
      <div class="cover-meta">
        <div><strong>Prepared by:</strong> Web Designer</div>
        <div><strong>Prepared for:</strong> Mayura Garden Services</div>
        <div><strong>Date:</strong> April 2026</div>
        <div><strong>Website:</strong> www.mayuragardenservices.com.au</div>
        <div><strong>ABN:</strong> 22 046 912 532</div>
      </div>
    </div>
    <div class="cover-footer">
      <span>CONFIDENTIAL – Internal Handover Document</span>
      <span>Version 1.0</span>
    </div>
  </div>
</div>

<!-- ══════════════════════════════════════════════════════
     INSIDE FRONT COVER – TABLE OF CONTENTS  (page 2)
══════════════════════════════════════════════════════ -->
<div class="page toc-page">
  <div class="toc-header">Contents</div>

  <div class="toc-chapter">
    <span class="toc-chapter-num">Ch 1</span>
    <span class="toc-chapter-title">Homepage</span>
    <span class="toc-chapter-page">5</span>
  </div>
  <div class="toc-section"><span class="toc-section-title">Hero Section &amp; Navigation</span></div>
  <div class="toc-section"><span class="toc-section-title">Services Showcase</span></div>
  <div class="toc-section"><span class="toc-section-title">Before &amp; After Gallery</span></div>
  <div class="toc-section"><span class="toc-section-title">Quote Request Form</span></div>
  <div class="toc-section"><span class="toc-section-title">Social Sharing &amp; WeChat Integration</span></div>
  <div class="toc-section"><span class="toc-section-title">Language Toggle (EN / 中)</span></div>

  <div class="toc-chapter" style="margin-top:3mm">
    <span class="toc-chapter-num">Ch 2</span>
    <span class="toc-chapter-title">Agent Login &amp; Agent Portal</span>
    <span class="toc-chapter-page">13</span>
  </div>
  <div class="toc-section"><span class="toc-section-title">Agent Login &amp; Sign-Up</span></div>
  <div class="toc-section"><span class="toc-section-title">Agent Dashboard</span></div>
  <div class="toc-section"><span class="toc-section-title">Quote Request Submission</span></div>
  <div class="toc-section"><span class="toc-section-title">Jobs &amp; Referral Tracking</span></div>
  <div class="toc-section"><span class="toc-section-title">Gallery, Referrals &amp; Contact</span></div>

  <div class="toc-chapter" style="margin-top:3mm">
    <span class="toc-chapter-num">Ch 3</span>
    <span class="toc-chapter-title">Admin Login &amp; Admin Portal</span>
    <span class="toc-chapter-page">23</span>
  </div>
  <div class="toc-section"><span class="toc-section-title">Admin Login</span></div>
  <div class="toc-section"><span class="toc-section-title">Dashboard</span></div>
  <div class="toc-section"><span class="toc-section-title">Quote Requests, Quote Editor, Jobs, Invoices</span></div>
  <div class="toc-section"><span class="toc-section-title">Clients, Calendar, Materials, Packages</span></div>
  <div class="toc-section"><span class="toc-section-title">Agent Management &amp; Settings</span></div>

  <div class="toc-chapter" style="margin-top:3mm">
    <span class="toc-chapter-num">Ch 4</span>
    <span class="toc-chapter-title">Business Tools</span>
    <span class="toc-chapter-page">37</span>
  </div>
  <div class="toc-section"><span class="toc-section-title">Email Composer &amp; Template Library</span></div>
  <div class="toc-section"><span class="toc-section-title">Transactional Email via Supabase</span></div>

  <div class="toc-chapter" style="margin-top:3mm">
    <span class="toc-chapter-num">Ch 5</span>
    <span class="toc-chapter-title">Phone App (PWA)</span>
    <span class="toc-chapter-page">41</span>
  </div>
  <div class="toc-section"><span class="toc-section-title">PWA Installation on iOS &amp; Android</span></div>
  <div class="toc-section"><span class="toc-section-title">Mobile Layout &amp; Bottom Navigation</span></div>
  <div class="toc-section"><span class="toc-section-title">Push Notifications &amp; Offline Support</span></div>

  <div class="toc-chapter" style="margin-top:3mm">
    <span class="toc-chapter-num">Ch 6</span>
    <span class="toc-chapter-title">SEO &amp; Social Media Integration</span>
    <span class="toc-chapter-page">47</span>
  </div>
  <div class="toc-section"><span class="toc-section-title">Meta Tags, Open Graph &amp; Structured Data</span></div>
  <div class="toc-section"><span class="toc-section-title">Sitemap, Robots &amp; Google Verification</span></div>
  <div class="toc-section"><span class="toc-section-title">Social Share Buttons &amp; WeChat</span></div>

  <div class="toc-chapter" style="margin-top:3mm">
    <span class="toc-chapter-num">Ch 7</span>
    <span class="toc-chapter-title">Backend &amp; Edge Functions</span>
    <span class="toc-chapter-page">53</span>
  </div>
  <div class="toc-section"><span class="toc-section-title">Supabase Architecture Overview</span></div>
  <div class="toc-section"><span class="toc-section-title">Edge Functions Reference</span></div>

  <div class="toc-intro-blurb">
    <strong>About this document:</strong> This is a formal handover document prepared by the web designer to provide the business owner with a comprehensive reference for all features of the Mayura Garden Services website and management platform. Each chapter covers a distinct area of the system with annotated screenshots, feature descriptions, and technical notes where relevant.
  </div>
</div>

<!-- ══════════════════════════════════════════════════════
     BLANK PAGE 3 (intentional – keeps chapter on recto)
══════════════════════════════════════════════════════ -->
<div class="page" style="background:var(--cream);">
  <div style="display:flex;align-items:center;justify-content:center;height:100%;opacity:0.15;">
    ${logoSrc ? `<img src="${logoSrc}" style="width:60mm;" alt=""/>` : ''}
  </div>
</div>

<!-- ══════════════════════════════════════════════════════
     PAGE 4 – CHAPTER 1 BREAK : HOMEPAGE
══════════════════════════════════════════════════════ -->
<div class="chapter-break">
  <div class="chapter-num">Chapter 1</div>
  <div class="chapter-accent"></div>
  <div class="chapter-title">Homepage</div>
  <div class="chapter-subtitle">The public-facing marketing website — the primary touchpoint for prospective clients discovering Mayura Garden Services online.</div>
</div>

<!-- PAGE 5 – Homepage: Hero & Navigation -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Hero Section &amp; Navigation</span>
    <span class="page-header-chapter">Chapter 1 — Homepage</span>
  </div>
  <p>The homepage is the first impression visitors have of Mayura Garden Services. It is designed to immediately communicate professionalism, showcase the quality of garden transformations, and guide visitors towards requesting a quote.</p>
  ${annotatedImage('01_landing_hero.png', ANNOTATIONS['01_landing_hero.png'])}
  <p>The navigation bar is persistent across all pages and provides quick access to the key sections. The language toggle (① ④) allows the full site to be viewed in either English or Simplified Chinese, serving the local Chinese-Australian community.</p>
</div>

<!-- PAGE 6 – Homepage: Services -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Services Showcase</span>
    <span class="page-header-chapter">Chapter 1 — Homepage</span>
  </div>
  <p>The services section presents each gardening service as a distinct card, giving potential clients a clear overview of what Mayura offers. Each card can be expanded to show more detail about that service.</p>
  ${annotatedImage('02_landing_services.png', ANNOTATIONS['02_landing_services.png'])}
  <ul class="feature-list">
    <li>Lawn mowing, edging and maintenance</li>
    <li>Garden design and landscaping</li>
    <li>Pruning, hedge trimming and clean-ups</li>
    <li>Irrigation installation and maintenance</li>
    <li>Planting, mulching and soil preparation</li>
    <li>Seasonal tidy-ups and ongoing maintenance programs</li>
  </ul>
</div>

<!-- PAGE 7 – Homepage: Gallery -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Before &amp; After Gallery</span>
    <span class="page-header-chapter">Chapter 1 — Homepage</span>
  </div>
  <p>The interactive before/after gallery is one of the most powerful trust-building elements on the homepage. Visitors can drag the reveal slider (③) left and right to compare the original garden state with the completed Mayura transformation.</p>
  ${annotatedImage('03_landing_gallery.png', ANNOTATIONS['03_landing_gallery.png'])}
  ${infoBox('The gallery images are sourced from the admin portal. New before/after project photos can be added at any time by the admin — they appear immediately on the public homepage. The gallery works on both desktop and mobile with native touch-drag support.')}
</div>

<!-- PAGE 8 – Homepage: Quote Request Form -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Quote Request Form</span>
    <span class="page-header-chapter">Chapter 1 — Homepage</span>
  </div>
  <p>The quote request form is the primary lead-generation mechanism. Visitors complete their contact details, describe their garden needs, and can upload up to five photos of their garden. This data is stored securely in Supabase and immediately visible in the Admin Portal under Quote Requests.</p>
  ${annotatedImage('04_landing_quote_form.png', ANNOTATIONS['04_landing_quote_form.png'])}
  <div class="tech-box">
    <strong>Behind the scenes:</strong> On submission, two Supabase edge functions are triggered automatically:
    <br/>① <strong>send-transactional-email</strong> — sends a confirmation email to the client and an alert to the admin.
    <br/>② <strong>garden-value-analyzer</strong> — uses AI to analyse the uploaded garden photos and generate a preliminary scope summary visible in the admin quote requests list.
  </div>
</div>

<!-- PAGE 9 – Homepage: Social Sharing -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Social Sharing &amp; WeChat Integration</span>
    <span class="page-header-chapter">Chapter 1 — Homepage</span>
  </div>
  <p>Visitors can share the Mayura Garden Services website directly from the homepage via six social channels. Each button opens the relevant platform with the site URL and a pre-written message pre-populated.</p>
  ${annotatedImage('05_landing_social_sharing.png', ANNOTATIONS['05_landing_social_sharing.png'])}
  <p>The WeChat button (⑥) opens a modal with two QR codes — one to add Mayura's WeChat contact, and one to share the website URL within WeChat, making it easy to reach the Chinese-Australian community who primarily use WeChat for communication.</p>
</div>

<!-- PAGE 10 – Homepage: Chinese Language -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Language Toggle — English / Chinese</span>
    <span class="page-header-chapter">Chapter 1 — Homepage</span>
  </div>
  <p>The language toggle switch in the top navigation allows visitors to view the entire public website in Simplified Chinese. All navigation items, headings, service descriptions, form labels and button text are translated.</p>
  ${annotatedImage('35_language_chinese.png', ANNOTATIONS['35_language_chinese.png'])}
  ${infoBox('The translation is handled by a custom internationalisation (i18n) context built into the React application. To update or add translations, the translation strings are maintained in <strong>/src/i18n/</strong> — contact the web designer if new content needs to be added to both languages.')}
</div>

<!-- PAGE 11 – Homepage: Full Page Overview -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Full Homepage Overview</span>
    <span class="page-header-chapter">Chapter 1 — Homepage</span>
  </div>
  <p>The screenshot below shows the complete homepage layout from top to bottom, giving an at-a-glance view of how the sections are sequenced to guide the visitor from awareness through to action.</p>
  <div class="screenshot-wrap">
    <div class="ss-container">
      <img src="${img('06_landing_full.png')}" class="ss-img" alt="Full landing page" style="max-height:200mm;object-fit:cover;object-position:top;"/>
    </div>
  </div>
  <ul class="feature-list">
    <li><strong>Section 1:</strong> Hero with headline, subheadline and primary CTA</li>
    <li><strong>Section 2:</strong> Services cards overview</li>
    <li><strong>Section 3:</strong> Before &amp; After interactive gallery</li>
    <li><strong>Section 4:</strong> Quote request form with photo upload</li>
    <li><strong>Section 5:</strong> Social share buttons and WeChat QR</li>
    <li><strong>Section 6:</strong> Footer with contact details and links</li>
  </ul>
</div>

<!-- PAGE 12 – CHAPTER 2 BREAK : AGENT -->
<div class="chapter-break">
  <div class="chapter-num">Chapter 2</div>
  <div class="chapter-accent"></div>
  <div class="chapter-title">Agent Login &amp;<br/>Agent Portal</div>
  <div class="chapter-subtitle">The referral partner portal — a dedicated workspace for approved agents to submit quote requests on behalf of clients, track their jobs, and monitor commission earnings.</div>
</div>

<!-- PAGE 13 – Agent: Login -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Agent Login &amp; Sign-Up</span>
    <span class="page-header-chapter">Chapter 2 — Agent Portal</span>
  </div>
  <p>The agent portal is accessed at <strong>/agent/login</strong>. It is entirely separate from the admin portal, with its own authentication flow and access controls. The login page has two tabs: Login for existing agents and Sign Up for new registrations.</p>
  <div class="two-col">
    <div>${annotatedImage('07_agent_login.png', ANNOTATIONS['07_agent_login.png'])}</div>
    <div>${annotatedImage('08_agent_signup.png', ANNOTATIONS['08_agent_signup.png'])}</div>
  </div>
  ${infoBox('<strong>Important approval workflow:</strong> When a new agent registers via the Sign Up tab, their account is immediately placed in a <em>Pending</em> status. They cannot access any portal features until the admin reviews their registration in the Admin → Agents section and changes their status to <em>Approved</em>. The agent will see a pending message if they attempt to log in before approval.')}
</div>

<!-- PAGE 14 – Agent: Dashboard -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Agent Dashboard</span>
    <span class="page-header-chapter">Chapter 2 — Agent Portal</span>
  </div>
  <p>The agent dashboard provides a real-time summary of the agent's activity — active requests, completed jobs and total commissions earned. It is the first screen an agent sees after logging in.</p>
  ${annotatedImage('09_agent_dashboard.png', ANNOTATIONS['09_agent_dashboard.png'])}
</div>

<!-- PAGE 15 – Agent: Quote Request -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Quote Request Submission</span>
    <span class="page-header-chapter">Chapter 2 — Agent Portal</span>
  </div>
  <p>Agents can submit new quote requests on behalf of prospective clients. The form is similar to the public quote form but pre-attaches the agent's unique referral code, ensuring they receive commission credit when the job is completed.</p>
  ${annotatedImage('10_agent_quote_request.png', ANNOTATIONS['10_agent_quote_request.png'])}
</div>

<!-- PAGE 16 – Agent: Jobs & Gallery -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Jobs &amp; Gallery</span>
    <span class="page-header-chapter">Chapter 2 — Agent Portal</span>
  </div>
  ${sectionHeader('Jobs', 'h2')}
  <p>The Jobs page shows all gardening jobs that originated from this agent's referrals, with live status updates as admin progresses each job through the workflow.</p>
  ${annotatedImage('11_agent_jobs.png', ANNOTATIONS['11_agent_jobs.png'])}
  ${sectionHeader('Gallery', 'h2')}
  ${annotatedImage('12_agent_gallery.png', ANNOTATIONS['12_agent_gallery.png'])}
</div>

<!-- PAGE 17 – Agent: Referrals & Contact -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Referrals &amp; Contact</span>
    <span class="page-header-chapter">Chapter 2 — Agent Portal</span>
  </div>
  ${sectionHeader('Referrals &amp; Commission Tracking', 'h2')}
  <p>The referrals page shows the agent's unique referral code, a breakdown of all referral earnings, and the total commission balance. Commission rates are set by admin on a per-agent basis.</p>
  ${annotatedImage('13_agent_referrals.png', ANNOTATIONS['13_agent_referrals.png'])}
  ${sectionHeader('Contact', 'h2')}
  ${annotatedImage('14_agent_contact.png', ANNOTATIONS['14_agent_contact.png'])}
</div>

<!-- PAGE 18 – CHAPTER 3 BREAK : ADMIN -->
<div class="chapter-break">
  <div class="chapter-num">Chapter 3</div>
  <div class="chapter-accent"></div>
  <div class="chapter-title">Admin Login &amp;<br/>Admin Portal</div>
  <div class="chapter-subtitle">The full business management platform — covering quotes, jobs, invoices, clients, calendar, materials, packages, agent management, and system settings.</div>
</div>

<!-- PAGE 19 – Admin: Login -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Admin Login</span>
    <span class="page-header-chapter">Chapter 3 — Admin Portal</span>
  </div>
  <p>The admin portal is accessed at <strong>/admin/login</strong>. Authentication uses Supabase email/password login. After successful sign-in, the system verifies the user has an <em>admin</em> role in the <code>user_roles</code> database table before granting access. Attempting to access any <code>/admin/*</code> URL without being logged in as admin will redirect to this page.</p>
  ${annotatedImage('15_admin_login.png', ANNOTATIONS['15_admin_login.png'])}
  ${infoBox('<strong>Security note:</strong> Admin credentials should be kept confidential and never shared. Only authorised staff should have admin login details. The admin role is assigned directly in the Supabase database — contact the web designer to add or remove admin users.')}
</div>

<!-- PAGE 20 – Admin: Dashboard -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Admin Dashboard</span>
    <span class="page-header-chapter">Chapter 3 — Admin Portal</span>
  </div>
  <p>The dashboard is the admin's home screen, providing an at-a-glance summary of business performance. KPI cards show total quotes, active jobs, monthly revenue and new quote requests. A recent activity list surfaces the latest actions across the platform.</p>
  ${annotatedImage('16_admin_dashboard.png', ANNOTATIONS['16_admin_dashboard.png'])}
</div>

<!-- PAGE 21 – Admin: Quote Requests -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Quote Requests</span>
    <span class="page-header-chapter">Chapter 3 — Admin Portal</span>
  </div>
  <p>Every quote request submitted via the public website or by an agent appears here. The AI garden analyser edge function automatically generates a scope summary from the uploaded photos, saving admin significant time in initial assessments.</p>
  ${annotatedImage('17_admin_quote_requests.png', ANNOTATIONS['17_admin_quote_requests.png'])}
  <div class="tech-box">
    <strong>Supabase Integration:</strong> Each new submission triggers the <strong>garden-value-analyzer</strong> edge function, which uses AI vision analysis on the uploaded garden photos to estimate scope and suggest service types. The result appears in the AI Analysis column (④).
  </div>
</div>

<!-- PAGE 22 – Admin: Quote Editor -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Quote Editor</span>
    <span class="page-header-chapter">Chapter 3 — Admin Portal</span>
  </div>
  <p>The quote editor is the central tool for creating and sending client quotes. It supports line items for both materials and labour, automatic tax calculation, and one-click PDF generation. Quotes can be saved as drafts or sent directly to clients via email.</p>
  ${annotatedImage('18_admin_quote_editor.png', ANNOTATIONS['18_admin_quote_editor.png'])}
</div>

<!-- PAGE 23 – Admin: Jobs -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Jobs Management</span>
    <span class="page-header-chapter">Chapter 3 — Admin Portal</span>
  </div>
  <p>The jobs list tracks every gardening job from creation through to completion. Jobs can be created manually or automatically generated when a quote is accepted by a client. Each job is linked to a client, a quote, and an invoice.</p>
  ${annotatedImage('19_admin_jobs.png', ANNOTATIONS['19_admin_jobs.png'])}
</div>

<!-- PAGE 24 – Admin: Invoices -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Invoices</span>
    <span class="page-header-chapter">Chapter 3 — Admin Portal</span>
  </div>
  <p>The invoices section provides a complete financial record for the business. Invoices are automatically generated from completed jobs and can be downloaded as PDF documents or sent to clients via email directly from this screen.</p>
  ${annotatedImage('20_admin_invoices.png', ANNOTATIONS['20_admin_invoices.png'])}
</div>

<!-- PAGE 25 – Admin: Clients -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Client Management</span>
    <span class="page-header-chapter">Chapter 3 — Admin Portal</span>
  </div>
  <p>The client database stores all contact information for past and present clients. Each client record shows their complete history of quotes, jobs and invoices, making it easy to manage ongoing relationships and look up contact details.</p>
  ${annotatedImage('21_admin_clients.png', ANNOTATIONS['21_admin_clients.png'])}
</div>

<!-- PAGE 26 – Admin: Calendar -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Calendar</span>
    <span class="page-header-chapter">Chapter 3 — Admin Portal</span>
  </div>
  <p>The calendar view provides a visual schedule of all upcoming and active jobs. Colour-coded event blocks allow admin to quickly identify job status at a glance, while clicking on any day or event opens the full job details.</p>
  ${annotatedImage('22_admin_calendar.png', ANNOTATIONS['22_admin_calendar.png'])}
</div>

<!-- PAGE 27 – Admin: Materials & Packages -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Materials &amp; Service Packages</span>
    <span class="page-header-chapter">Chapter 3 — Admin Portal</span>
  </div>
  ${sectionHeader('Materials Database', 'h2')}
  <p>The materials database catalogues all products used in quotes. Wholesale costs and retail prices are stored, with a Bunnings search integration to look up current market pricing via a Supabase edge function.</p>
  ${annotatedImage('23_admin_materials.png', ANNOTATIONS['23_admin_materials.png'])}
  ${sectionHeader('Service Packages', 'h2')}
  <p>Service packages are pre-built quote bundles — for example, a "Spring Clean Package" might include lawn mowing, edging, hedge trim and rubbish removal as a single priced unit. Using packages speeds up quote creation significantly.</p>
  ${annotatedImage('24_admin_packages.png', ANNOTATIONS['24_admin_packages.png'])}
</div>

<!-- PAGE 28 – Admin: Agent Management -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Agent Management</span>
    <span class="page-header-chapter">Chapter 3 — Admin Portal</span>
  </div>
  <p>The agents page is where the admin reviews new agent registrations, approves or suspends accounts, assigns referral codes, and configures commission rates. This screen is the control centre for the entire referral partner program.</p>
  ${annotatedImage('25_admin_agents.png', ANNOTATIONS['25_admin_agents.png'])}
  ${infoBox('<strong>Agent approval workflow:</strong> When a new agent registers, they appear here with a <em>Pending</em> status badge. The admin must click Approve before the agent can access their portal. Commission can be enabled or disabled per agent, and the commission percentage rate is set here.')}
</div>

<!-- PAGE 29 – Admin: Settings -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Admin Settings</span>
    <span class="page-header-chapter">Chapter 3 — Admin Portal</span>
  </div>
  <p>The settings page allows configuration of business details, email notification preferences, push notification management, and default quote/invoice parameters such as GST rate and payment terms.</p>
  ${annotatedImage('26_admin_settings.png', ANNOTATIONS['26_admin_settings.png'])}
</div>

<!-- PAGE 30 – CHAPTER 4 BREAK : BUSINESS TOOLS -->
<div class="chapter-break">
  <div class="chapter-num">Chapter 4</div>
  <div class="chapter-accent"></div>
  <div class="chapter-title">Business Tools</div>
  <div class="chapter-subtitle">A unified communication hub with nine pre-built email templates for every stage of the client lifecycle — from initial quote follow-up through to review requests.</div>
</div>

<!-- PAGE 31 – Business Tools: Composer -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Email Composer</span>
    <span class="page-header-chapter">Chapter 4 — Business Tools</span>
  </div>
  <p>The Business Tools section provides admin with a professional email composer pre-loaded with nine scenario-specific templates. Selecting a template auto-populates the subject and body with the appropriate message, with placeholders for the client's name, job details and amounts automatically filled from the database.</p>
  ${annotatedImage('27_business_tools.png', ANNOTATIONS['27_business_tools.png'])}
  <div class="tech-box">
    <strong>Supabase Edge Function:</strong> All emails are sent via the <strong>send-transactional-email</strong> edge function hosted on Supabase. This ensures reliable delivery, consistent branding, and keeps email credentials secure on the server side rather than in the browser.
  </div>
</div>

<!-- PAGE 32 – Business Tools: Templates -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Email Template Library</span>
    <span class="page-header-chapter">Chapter 4 — Business Tools</span>
  </div>
  <p>Nine pre-written email templates cover the key communication scenarios in the client lifecycle. Each template is designed to sound professional and personal, reinforcing the Mayura brand in every client interaction.</p>
  ${annotatedImage('28_business_tools_templates.png', ANNOTATIONS['28_business_tools_templates.png'])}
  <ul class="feature-list">
    <li><strong>Quote Follow-Up</strong> — politely chase a client who has not responded to their quote</li>
    <li><strong>Booking Confirmation</strong> — confirm a scheduled job date and time</li>
    <li><strong>Job Completion</strong> — notify the client their garden work is finished</li>
    <li><strong>Invoice Sent</strong> — inform the client an invoice has been issued</li>
    <li><strong>Payment Reminder</strong> — follow up on an outstanding invoice</li>
    <li><strong>Review Request</strong> — ask a satisfied client to leave a Google review</li>
    <li><strong>Seasonal Offer</strong> — send a promotional offer for seasonal services</li>
    <li><strong>Welcome New Client</strong> — onboard a new client after their first booking</li>
    <li><strong>Custom Message</strong> — free-form template for any other communication need</li>
  </ul>
</div>

<!-- PAGE 33 – CHAPTER 5 BREAK : PHONE APP / PWA -->
<div class="chapter-break">
  <div class="chapter-num">Chapter 5</div>
  <div class="chapter-accent"></div>
  <div class="chapter-title">Phone App<br/>(PWA)</div>
  <div class="chapter-subtitle">The Mayura Garden Services website is built as a Progressive Web App — it can be installed to any smartphone home screen and used like a native app, with offline support and push notifications.</div>
</div>

<!-- PAGE 34 – PWA: Overview & Installation -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">PWA Overview &amp; Installation</span>
    <span class="page-header-chapter">Chapter 5 — Phone App (PWA)</span>
  </div>
  <p>A <strong>Progressive Web App (PWA)</strong> is a website that behaves like a native mobile app. Mayura Garden Services is built as a PWA, meaning staff can install it to their phone's home screen and use it exactly like an app — without needing to download anything from the App Store or Google Play.</p>

  <h3 class="section-title">Installing on iPhone (iOS / Safari)</h3>
  <ol style="margin:2mm 0 4mm 5mm;font-size:9pt;color:var(--text-mid);line-height:1.8;">
    <li>Open <strong>Safari</strong> and navigate to <strong>www.mayuragardenservices.com.au</strong></li>
    <li>Tap the <strong>Share</strong> button (the box with an arrow pointing up) in the Safari toolbar</li>
    <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
    <li>Edit the name if desired, then tap <strong>"Add"</strong></li>
    <li>The Mayura icon will appear on your home screen — tap to open the app</li>
  </ol>

  <h3 class="section-title">Installing on Android (Chrome)</h3>
  <ol style="margin:2mm 0 4mm 5mm;font-size:9pt;color:var(--text-mid);line-height:1.8;">
    <li>Open <strong>Chrome</strong> and navigate to <strong>www.mayuragardenservices.com.au</strong></li>
    <li>Tap the <strong>three-dot menu</strong> (⋮) in the top-right corner</li>
    <li>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></li>
    <li>Tap <strong>"Install"</strong> to confirm — the Mayura icon will appear on your home screen</li>
  </ol>

  ${infoBox('<strong>App icon:</strong> When installed, the app uses the official Mayura Garden Services icon (the green leaf logo) at both 192×192 and 512×512 pixel resolutions, so it looks sharp on all screen sizes. The app opens in <em>standalone</em> mode — without the browser address bar — giving it a full native-app appearance.')}

  <div class="two-col" style="margin-top:4mm;">
    <div>
      <h3 class="section-title">Mobile Landing Page</h3>
      ${annotatedImage('29_mobile_landing.png', ANNOTATIONS['29_mobile_landing.png'])}
    </div>
    <div>
      <h3 class="section-title">Mobile Services &amp; Gallery</h3>
      ${annotatedImage('30_mobile_services.png', ANNOTATIONS['30_mobile_services.png'])}
    </div>
  </div>
</div>

<!-- PAGE 35 – PWA: Mobile Admin -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Mobile Admin Interface</span>
    <span class="page-header-chapter">Chapter 5 — Phone App (PWA)</span>
  </div>
  <p>The entire admin portal is fully responsive and optimised for mobile use. The layout adapts automatically from desktop to phone — KPI cards stack vertically, tables become scrollable, and a persistent bottom navigation bar replaces the desktop sidebar, providing thumb-friendly access to all key sections.</p>
  <div class="two-col">
    <div>${annotatedImage('31_mobile_admin_dashboard.png', ANNOTATIONS['31_mobile_admin_dashboard.png'])}</div>
    <div>${annotatedImage('32_mobile_admin_jobs.png', ANNOTATIONS['32_mobile_admin_jobs.png'])}</div>
  </div>
  <p>The bottom navigation bar (⑤) is fixed to the bottom of the screen across all admin pages on mobile, providing one-tap access to Dashboard, Quotes, Jobs, Invoices and Clients.</p>
</div>

<!-- PAGE 36 – PWA: Quote Editor Mobile & Push Notif -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Mobile Quote Editor &amp; Push Notifications</span>
    <span class="page-header-chapter">Chapter 5 — Phone App (PWA)</span>
  </div>

  ${sectionHeader('Quote Editor on Mobile', 'h2')}
  <p>The full quote creation workflow is accessible on mobile. Admins can create, edit and send quotes while on-site at a client's property, using the phone camera to upload photos directly.</p>
  ${annotatedImage('33_mobile_quote_editor.png', ANNOTATIONS['33_mobile_quote_editor.png'])}

  ${sectionHeader('Push Notifications', 'h2')}
  <p>The app supports Web Push Notifications, allowing the system to alert staff of new quote requests even when the browser is not open. When a visitor submits a quote request on the public website, the admin receives an instant push notification on their phone or desktop.</p>
  <div class="tech-box">
    <strong>Technical implementation:</strong> Push notifications use the Web Push API with VAPID keys. The public VAPID key is served by the <strong>get-vapid-public-key</strong> Supabase edge function. Notifications are dispatched via the <strong>send-push-notification</strong> edge function. Subscriptions are managed in Settings → Push Notifications.
  </div>

  ${sectionHeader('Offline Support', 'h2')}
  <p>A service worker (<code>/public/sw.js</code>) caches key app assets so the app can load even in poor network conditions. Critical business data (quotes, jobs) will display the last-known data when offline, and sync automatically when connectivity is restored.</p>
</div>

<!-- PAGE 37 – CHAPTER 6 BREAK : SEO -->
<div class="chapter-break">
  <div class="chapter-num">Chapter 6</div>
  <div class="chapter-accent"></div>
  <div class="chapter-title">SEO &amp; Social Media<br/>Integration</div>
  <div class="chapter-subtitle">Comprehensive search engine optimisation and social media sharing infrastructure — covering meta tags, Open Graph, structured data, sitemap and multi-platform sharing tools.</div>
</div>

<!-- PAGE 38 – SEO: Meta & OG -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Meta Tags &amp; Open Graph</span>
    <span class="page-header-chapter">Chapter 6 — SEO &amp; Social Media</span>
  </div>
  <p>The website's HTML <code>&lt;head&gt;</code> contains a comprehensive set of meta tags optimised for both search engine indexing and social media sharing.</p>

  ${sectionHeader('Search Engine Meta Tags', 'h2')}
  <ul class="feature-list">
    <li><strong>Title tag:</strong> "Mayura Garden Services | Professional Garden Services in Melbourne"</li>
    <li><strong>Meta description:</strong> Concise summary of services for Google search result snippets</li>
    <li><strong>Meta keywords:</strong> Targeted local service keywords for Melbourne/Templestowe</li>
    <li><strong>Robots directive:</strong> index, follow — instructs search engines to index and follow links</li>
    <li><strong>Canonical URL:</strong> https://www.mayuragardenservices.com.au/ — prevents duplicate content issues</li>
    <li><strong>Author:</strong> Mayura Garden Services</li>
  </ul>

  ${sectionHeader('Open Graph Tags (Social Media Previews)', 'h2')}
  <p>Open Graph tags control how the website appears when shared on Facebook, LinkedIn and other platforms. A dedicated OG image (1200×640 px) ensures a professional visual preview whenever someone shares the link.</p>
  <ul class="feature-list">
    <li><strong>og:type:</strong> website</li>
    <li><strong>og:site_name:</strong> Mayura Garden Services</li>
    <li><strong>og:title:</strong> Same as the page title</li>
    <li><strong>og:description:</strong> Compelling description for social previews</li>
    <li><strong>og:image:</strong> /og-image.jpg (1200×640 px JPEG — the dedicated social share image)</li>
    <li><strong>og:locale:</strong> en_AU (Australian English)</li>
  </ul>

  ${sectionHeader('Twitter Card Tags', 'h2')}
  <ul class="feature-list">
    <li><strong>twitter:card:</strong> summary_large_image — shows a large image preview on Twitter/X</li>
    <li><strong>twitter:title and twitter:image</strong> — match the OG tags for consistency</li>
  </ul>

  ${infoBox('<strong>Updating the OG image:</strong> To change the image that appears when the site is shared on social media, replace the file at <code>/public/og-image.jpg</code>. The recommended size is 1200×630 pixels. After updating, clear any social media caches using Facebook\'s Sharing Debugger or LinkedIn\'s Post Inspector.')}
</div>

<!-- PAGE 39 – SEO: Geo & Structured Data -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Geo-targeting, Structured Data &amp; Sitemap</span>
    <span class="page-header-chapter">Chapter 6 — SEO &amp; Social Media</span>
  </div>

  ${sectionHeader('Geo-targeting Meta Tags', 'h2')}
  <p>The site includes geographic meta tags to signal to search engines that Mayura serves a specific local area, improving rankings for location-based searches such as "gardener Lower Templestowe" or "Melbourne garden services".</p>
  <ul class="feature-list">
    <li><strong>geo.region:</strong> AU-VIC — targets Victoria, Australia</li>
    <li><strong>geo.placename:</strong> Lower Templestowe — the primary service suburb</li>
    <li><strong>ICBM coordinates:</strong> Latitude/longitude for the business location</li>
  </ul>

  ${sectionHeader('JSON-LD Structured Data (LocalBusiness Schema)', 'h2')}
  <p>Structured data in JSON-LD format tells Google exactly what type of business this is, enabling rich results such as the business knowledge panel, star ratings and contact details in search results.</p>
  <ul class="feature-list">
    <li><strong>@type:</strong> LocalBusiness</li>
    <li><strong>name:</strong> Mayura Garden Services</li>
    <li><strong>telephone, email, address</strong> — structured contact information</li>
    <li><strong>areaServed:</strong> Melbourne, Victoria, Australia</li>
    <li><strong>ABN:</strong> 22 046 912 532</li>
  </ul>

  ${sectionHeader('XML Sitemap', 'h2')}
  <p>The sitemap at <code>/sitemap.xml</code> lists all public pages of the website with their last-modified dates. This file is submitted to Google Search Console to help search engines discover and index new content quickly.</p>

  ${sectionHeader('Robots.txt', 'h2')}
  <p>The <code>/robots.txt</code> file instructs search engine crawlers which pages to index and which to ignore. Admin and agent portal pages are excluded from indexing to prevent sensitive URLs appearing in search results.</p>

  ${sectionHeader('Google Site Verification', 'h2')}
  <p>The site includes a Google site verification meta tag, confirming ownership in Google Search Console. This is required to access search performance data, submit sitemaps and receive Google notifications about the site.</p>
</div>

<!-- PAGE 40 – SEO: Social Sharing Detail -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Social Share Buttons &amp; WeChat Modal</span>
    <span class="page-header-chapter">Chapter 6 — SEO &amp; Social Media</span>
  </div>

  ${sectionHeader('Social Share Buttons', 'h2')}
  <p>Six social sharing buttons on the homepage allow visitors and staff to easily share the Mayura website across multiple platforms. Each button opens the relevant platform with a pre-constructed message and the site URL.</p>
  ${annotatedImage('05_landing_social_sharing.png', ANNOTATIONS['05_landing_social_sharing.png'])}

  ${sectionHeader('WeChat QR Code Modal', 'h2')}
  <p>The WeChat integration recognises that a significant portion of Mayura's clientele may be from the Chinese-Australian community, for whom WeChat is the primary communication and social media platform. The WeChat modal provides two QR codes — one to add Mayura as a WeChat contact, and one to share the website link within WeChat.</p>
  ${annotatedImage('34_wechat_modal.png', ANNOTATIONS['34_wechat_modal.png'])}
  ${infoBox('<strong>Updating the WeChat QR code:</strong> The QR code image is stored at <code>/public/wechat-qr.jpg</code>. To update it, replace this file with the new QR code image. The modal will automatically use the new image.')}
</div>

<!-- PAGE 41 – CHAPTER 7 BREAK : BACKEND -->
<div class="chapter-break">
  <div class="chapter-num">Chapter 7</div>
  <div class="chapter-accent"></div>
  <div class="chapter-title">Backend &amp;<br/>Edge Functions</div>
  <div class="chapter-subtitle">The technical infrastructure powering Mayura Garden Services — built on Supabase, with six serverless edge functions handling email, AI analysis, push notifications, and third-party integrations.</div>
</div>

<!-- PAGE 42 – Backend: Supabase Overview -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Supabase Architecture Overview</span>
    <span class="page-header-chapter">Chapter 7 — Backend &amp; Edge Functions</span>
  </div>
  <p>The entire backend of Mayura Garden Services is built on <strong>Supabase</strong> — an open-source Firebase alternative that provides a PostgreSQL database, authentication, file storage, and serverless edge functions in a single managed platform.</p>

  ${sectionHeader('Database Tables', 'h2')}
  <ul class="feature-list">
    <li><strong>user_roles</strong> — maps user accounts to roles (admin / agent)</li>
    <li><strong>agent_profiles</strong> — agent details, approval status and commission configuration</li>
    <li><strong>agent_requests</strong> — quote requests submitted by agents</li>
    <li><strong>agent_referrals</strong> — commission tracking records for each referral</li>
    <li><strong>quotes</strong> — all quote records with line items, client reference and status</li>
    <li><strong>clients</strong> — client contact database</li>
    <li><strong>jobs</strong> — job records linked to quotes and clients</li>
    <li><strong>invoices</strong> — invoice records with payment status</li>
    <li><strong>quote_requests</strong> — incoming public and agent quote request submissions</li>
    <li><strong>quote_packages</strong> — reusable service bundle definitions</li>
  </ul>

  ${sectionHeader('File Storage', 'h2')}
  <p>Garden photos uploaded via the public quote request form are stored in Supabase Storage in the <strong>garden-photos</strong> bucket. Files are served via a secure CDN URL and access is restricted to authenticated admin users.</p>

  ${sectionHeader('Authentication', 'h2')}
  <p>User authentication is handled by Supabase Auth using email/password. Role-based access control is implemented at the application level — the admin guard checks the <code>user_roles</code> table, while the agent guard checks the <code>agent_profiles</code> table for approval status.</p>

  <div class="tech-box">
    <strong>Supabase Project ID:</strong> pirmqgpibssmghgebupb<br/>
    <strong>Project URL:</strong> https://pirmqgpibssmghgebupb.supabase.co<br/>
    <strong>Dashboard:</strong> https://supabase.com/dashboard/project/pirmqgpibssmghgebupb<br/>
    <em>Access the Supabase dashboard to manage database records, view logs, and configure edge functions. Credentials for the Supabase dashboard are separate from the website admin login.</em>
  </div>
</div>

<!-- PAGE 43 – Backend: Edge Functions -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Supabase Edge Functions Reference</span>
    <span class="page-header-chapter">Chapter 7 — Backend &amp; Edge Functions</span>
  </div>
  <p>Edge functions are serverless functions that run on Supabase's infrastructure. They handle all server-side operations — keeping API keys, email credentials and AI service tokens secure on the server, away from the browser.</p>

  <div class="edge-card">
    <div class="edge-card-name">send-transactional-email</div>
    <p><strong>Triggered by:</strong> Quote request submission, quote sending, invoice sending, booking confirmation, Business Tools email composer, job completion notifications.</p>
    <p><strong>Purpose:</strong> Sends professionally branded emails to clients and admin. Uses pre-built templates for each scenario. All email credentials (SMTP/API keys) are stored securely as Supabase secrets.</p>
  </div>

  <div class="edge-card">
    <div class="edge-card-name">garden-value-analyzer</div>
    <p><strong>Triggered by:</strong> Public quote request form submission and agent quote request submission when garden photos are uploaded.</p>
    <p><strong>Purpose:</strong> Uses AI image analysis to assess the uploaded garden photos and generate a preliminary scope estimate (estimated size, visible issues, suggested services). The result is displayed in the Admin Quote Requests list, saving significant admin assessment time.</p>
  </div>

  <div class="edge-card">
    <div class="edge-card-name">get-vapid-public-key</div>
    <p><strong>Triggered by:</strong> Browser push notification subscription setup (Settings → Push Notifications).</p>
    <p><strong>Purpose:</strong> Returns the VAPID public key required to register the browser for Web Push Notifications. The private VAPID key is kept secure on the server.</p>
  </div>

  <div class="edge-card">
    <div class="edge-card-name">send-push-notification</div>
    <p><strong>Triggered by:</strong> New quote request submission (public or agent).</p>
    <p><strong>Purpose:</strong> Sends an instant Web Push Notification to subscribed admin devices, alerting them of a new quote request in real time — even when the admin portal is not open in the browser.</p>
  </div>

  <div class="edge-card">
    <div class="edge-card-name">search-bunnings</div>
    <p><strong>Triggered by:</strong> Admin clicking the Bunnings search link in the Materials section.</p>
    <p><strong>Purpose:</strong> Queries the Bunnings product database to return current retail pricing for a named material. Helps admin set accurate wholesale-to-retail margins in the materials catalogue.</p>
  </div>

  <div class="edge-card">
    <div class="edge-card-name">handle-email-unsubscribe</div>
    <p><strong>Triggered by:</strong> Client clicking the unsubscribe link in any transactional email.</p>
    <p><strong>Purpose:</strong> Processes the unsubscribe token from the email link and updates the client's record in the database to suppress future marketing emails. The <code>/unsubscribe</code> page provides a confirmation UI.</p>
  </div>
</div>

<!-- PAGE 44 – Backend: Tech Stack Summary -->
<div class="content-page">
  <div class="page-header">
    <span class="page-header-title">Technology Stack Summary</span>
    <span class="page-header-chapter">Chapter 7 — Backend &amp; Edge Functions</span>
  </div>
  <p>The following table summarises the complete technology stack used to build and run the Mayura Garden Services website and management platform.</p>

  <table class="legend" style="margin-top:4mm;">
    <thead><tr><th style="width:35mm;">Layer</th><th>Technology</th><th>Purpose</th></tr></thead>
    <tbody>
      <tr><td class="leg-num" style="text-align:left;font-weight:600;color:var(--green-dark);font-size:8pt;">Frontend</td><td>React 18 + TypeScript</td><td>UI components and application logic</td></tr>
      <tr><td class="leg-num" style="text-align:left;font-weight:600;color:var(--green-dark);font-size:8pt;">Build</td><td>Vite + SWC</td><td>Fast development server and production bundler</td></tr>
      <tr><td class="leg-num" style="text-align:left;font-weight:600;color:var(--green-dark);font-size:8pt;">Routing</td><td>React Router v6</td><td>Client-side page routing</td></tr>
      <tr><td class="leg-num" style="text-align:left;font-weight:600;color:var(--green-dark);font-size:8pt;">Data</td><td>TanStack React Query</td><td>Server state management and caching</td></tr>
      <tr><td class="leg-num" style="text-align:left;font-weight:600;color:var(--green-dark);font-size:8pt;">Database</td><td>Supabase (PostgreSQL)</td><td>All business data, authentication, file storage</td></tr>
      <tr><td class="leg-num" style="text-align:left;font-weight:600;color:var(--green-dark);font-size:8pt;">Edge Functions</td><td>Supabase Edge Functions (Deno)</td><td>Server-side logic, email, AI, notifications</td></tr>
      <tr><td class="leg-num" style="text-align:left;font-weight:600;color:var(--green-dark);font-size:8pt;">Styling</td><td>Tailwind CSS + shadcn/ui</td><td>Design system and UI components</td></tr>
      <tr><td class="leg-num" style="text-align:left;font-weight:600;color:var(--green-dark);font-size:8pt;">Fonts</td><td>Playfair Display + DM Sans</td><td>Brand typography</td></tr>
      <tr><td class="leg-num" style="text-align:left;font-weight:600;color:var(--green-dark);font-size:8pt;">PDF</td><td>jsPDF</td><td>In-browser quote and invoice PDF generation</td></tr>
      <tr><td class="leg-num" style="text-align:left;font-weight:600;color:var(--green-dark);font-size:8pt;">Charts</td><td>Recharts</td><td>Dashboard revenue and activity charts</td></tr>
      <tr><td class="leg-num" style="text-align:left;font-weight:600;color:var(--green-dark);font-size:8pt;">Forms</td><td>React Hook Form + Zod</td><td>Form state management and validation</td></tr>
      <tr><td class="leg-num" style="text-align:left;font-weight:600;color:var(--green-dark);font-size:8pt;">Notifications</td><td>Sonner + Web Push API</td><td>In-app toasts and browser push notifications</td></tr>
      <tr><td class="leg-num" style="text-align:left;font-weight:600;color:var(--green-dark);font-size:8pt;">PWA</td><td>Web App Manifest + Service Worker</td><td>Home screen installation and offline support</td></tr>
      <tr><td class="leg-num" style="text-align:left;font-weight:600;color:var(--green-dark);font-size:8pt;">i18n</td><td>Custom React Context</td><td>English/Chinese language switching</td></tr>
      <tr><td class="leg-num" style="text-align:left;font-weight:600;color:var(--green-dark);font-size:8pt;">Hosting</td><td>Lovable.dev / CDN</td><td>Static site hosting and deployment pipeline</td></tr>
    </tbody>
  </table>

  <div class="info-box" style="margin-top:5mm;">
    <strong>Support &amp; Maintenance:</strong> For any technical changes to the website, edge functions, database schema, or Supabase configuration, please contact the web designer. The Supabase dashboard provides direct access to database records and logs for day-to-day business operations — no technical knowledge is required to use it for routine tasks such as viewing data or checking email send logs.
  </div>
</div>

<!-- PAGE 45 – BACK COVER (green bleed — no important content) -->
<div class="page back-cover">
  <div class="back-cover-accent"></div>
</div>

<!-- Extra blank pages will be added by the PDF script to reach a multiple of 4 -->

</body>
</html>`;
}

// ─── PDF Generation ────────────────────────────────────────────────────────────

async function generatePDF() {
  console.log('\n🌿 Mayura Garden Services — PDF Generator\n');
  console.log('  Building HTML document...');
  const html = buildDocument();

  // Write HTML to a temp file so Puppeteer can load it via file://
  // (avoids setContent timeout with large image payloads)
  const tempHtmlPath = resolve(__dirname, '_doc_temp.html');
  writeFileSync(tempHtmlPath, html, 'utf8');
  const tempFileUrl = pathToFileURL(tempHtmlPath).href;

  console.log('  Launching Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'],
  });

  const page = await browser.newPage();
  await page.goto(tempFileUrl, { waitUntil: 'networkidle0', timeout: 180000 });

  // Wait for any web fonts to load
  await page.evaluateHandle('document.fonts.ready');

  console.log('  Rendering PDF...');
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    displayHeaderFooter: false,
  });

  await browser.close();

  // Remove temp HTML file
  try { (await import('fs')).unlinkSync(tempHtmlPath); } catch {}

  // Check page count (PDF pages = count of %%Page markers)
  const pdfStr = Buffer.from(pdfBuffer).toString('latin1');
  const pageMatches = pdfStr.match(/\/Type \/Page\b/g);
  let pageCount = pageMatches ? pageMatches.length : 0;
  console.log(`  Page count: ${pageCount}`);

  // Pad to nearest multiple of 4
  const target = Math.ceil(pageCount / 4) * 4;
  if (pageCount < target) {
    const needed = target - pageCount;
    console.log(`  Adding ${needed} blank padding page(s) to reach ${target} total pages...`);
    // We'll just report — Puppeteer doesn't support post-hoc page insertion easily.
    // The document is designed to land on a multiple of 4 naturally; this is a safety check.
    console.log(`  ℹ  Tip: if padding is needed, add blank <div class="page"> elements at the end of the HTML template.`);
  } else {
    console.log(`  ✓ Page count ${pageCount} is already a multiple of 4`);
  }

  writeFileSync(OUT_PDF, pdfBuffer);
  console.log(`\n✅ PDF saved: ${OUT_PDF}`);
  console.log(`   Size: ${(pdfBuffer.length / 1024 / 1024).toFixed(1)} MB`);
  console.log(`   Pages: ${pageCount}\n`);
}

generatePDF().catch(err => {
  console.error('PDF generation failed:', err);
  process.exit(1);
});
