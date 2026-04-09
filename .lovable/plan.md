

## Plan: Full Real Estate Agent Portal

### Overview

Build a complete agent portal where real estate agents can sign up, log in, request quotes, track job progress, view before/after galleries, re-order services, and manage referral credits. The admin side gets agent management and commission tracking.

### Database Changes (Migration)

**New tables:**

1. **agent_profiles** — `id (uuid PK)`, `user_id (uuid, FK auth.users, unique)`, `agency_name (text)`, `agent_name (text)`, `phone (text)`, `email (text)`, `status (text: pending/approved/suspended, default pending)`, `referral_code (text, unique, auto-generated)`, `commission_rate (numeric, default 5)`, `created_at`, `updated_at`
   - RLS: agents read/update own row; admin (service role) manages all

2. **agent_requests** — `id (uuid PK)`, `agent_id (uuid, FK agent_profiles)`, `property_address (text)`, `property_type (text)`, `service_package (text)`, `preferred_date (date)`, `notes (text)`, `status (text: pending/quoted/accepted/completed, default pending)`, `quote_id (uuid, nullable, FK quotes)`, `created_at`, `updated_at`
   - RLS: agents manage own requests

3. **agent_referrals** — `id (uuid PK)`, `agent_id (uuid, FK agent_profiles)`, `job_id (uuid, FK jobs)`, `invoice_id (uuid, nullable, FK invoices)`, `commission_amount (numeric)`, `status (text: pending/earned/paid, default pending)`, `paid_date (date, nullable)`, `created_at`
   - RLS: agents read own referrals

4. **service_packages** — `id (uuid PK)`, `user_id (uuid)`, `name (text)`, `description (text)`, `items (jsonb)`, `base_price (numeric)`, `is_active (boolean, default true)`, `created_at`
   - RLS: authenticated users manage own; agents can read active packages

**Modify existing:**
- Add `agent_request_id (uuid, nullable)` column to **quotes** table
- Add `referral_agent_id (uuid, nullable)` column to **jobs** table

### Authentication

- Agents use standard email/password signup (separate from admin)
- New `AgentGuard` component checks `agent_profiles` table for approved status
- Admin and agent are distinguished by checking which profile table has a matching `user_id`
- Login page gets a toggle: "Admin" / "Agent" tab (agents redirected to `/agent` routes)

### New Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/agent/login` | AgentLogin | Signup + login for agents |
| `/agent` | AgentDashboard | Overview: active jobs, pending requests, referral credits |
| `/agent/request` | AgentQuoteRequest | Submit new quote request with package selection |
| `/agent/jobs` | AgentJobs | Live job tracker with status timeline |
| `/agent/jobs/:id` | AgentJobView | Job detail with before/after photos, status updates |
| `/agent/gallery` | AgentGallery | Before/after portfolio for agent marketing |
| `/agent/referrals` | AgentReferrals | Commission tracking dashboard |
| `/admin/agents` | AdminAgents | Manage agent accounts (approve/suspend) |
| `/admin/packages` | AdminPackages | Create/edit service packages |

### Agent Features

1. **Quote Request Flow** — Agent selects a service package (or custom), enters property address, preferred date, notes, and optional photos. Request appears in admin dashboard for quoting.

2. **Live Job Tracker** — Agent sees real-time status progression: `Requested → Quoted → Accepted → Scheduled → In Progress → Completed`. Each stage shows date/time stamps.

3. **Before/After Gallery** — Agent can view completed job photos (uploaded by admin via existing `garden-photos` bucket). Includes download/share buttons for marketing.

4. **One-Click Re-order** — From job history, agent can duplicate a previous request for the same or different property.

5. **Referral & Commission Dashboard** — Shows earned/pending/paid commissions. Commission auto-calculated when linked jobs are invoiced.

### Admin Features

1. **Agent Management** (`/admin/agents`) — View all agents, approve/suspend accounts, see their request history and commission totals.

2. **Service Packages** (`/admin/packages`) — Create pre-built packages (e.g., "Front Yard Tidy $450", "Full Pre-Sale Makeover $1,200") with itemized materials/labour.

3. **Link Requests to Quotes** — When processing an agent request, admin creates a quote that auto-links back. Agent sees the quote details.

4. **Commission Tracking** — Admin dashboard card showing total commissions owed. Mark commissions as paid.

### Navigation

- **Agent layout** (`AgentLayout`): New sidebar/header with agent-specific nav (Dashboard, New Request, My Jobs, Gallery, Referrals, Logout)
- **Admin layout**: Add "Agents" and "Packages" to existing nav items
- Landing page footer: Add "Agent Login" link

### Technical Details

- **Agent guard**: Similar to `AdminGuard` but checks `agent_profiles` table for `status = 'approved'`
- **Hooks**: `useAgentProfile`, `useAgentRequests`, `useAgentReferrals`, `useServicePackages`
- **Realtime**: Enable realtime on `agent_requests` and `jobs` so agents see live status updates
- **Photo sharing**: Agent gallery reads from existing `garden-photos` storage bucket, filtered by job
- **Referral code**: Auto-generated 8-char alphanumeric code on agent signup
- **Commission calc**: Triggered when invoice is created for a job with `referral_agent_id` set

### Implementation Order

1. Database migration (4 new tables + 2 column additions)
2. Agent auth (signup, login, guard, profile)
3. Agent layout and dashboard
4. Service packages (admin CRUD + agent selection)
5. Quote request flow (agent submit → admin process)
6. Job tracker with realtime updates
7. Before/after gallery with photo sharing
8. Referral and commission system
9. Admin agent management page
10. Landing page agent login link

