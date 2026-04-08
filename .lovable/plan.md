

## Plan: Full Business Management Backend

This is a major expansion — moving from localStorage to a persistent database and adding job management, invoicing, payments, calendar, and forecasting.

### Current State
- Quotes stored in localStorage (lost on browser clear)
- No job tracking, invoicing, or payment system
- Email templates exist but quotes aren't persisted in the database
- Settings also in localStorage

### What We Will Build

**Phase 1 — Database Tables & Migration**

Create these tables (all linked to the authenticated user via `user_id`):

1. **clients** — name, email, phone, address
2. **quotes** — client_id (FK), status (draft/sent/accepted/declined), items (JSONB), subtotal, markup_total, grand_total, notes, created_at
3. **jobs** — quote_id (FK), client_id (FK), job_number (auto-generated, e.g. MGS-001), status (scheduled/in_progress/completed/invoiced), scheduled_date, completed_date, notes
4. **invoices** — job_id (FK), client_id (FK), invoice_number (auto-generated), amount, gst_amount, total_with_gst, status (unpaid/sent/paid/overdue), due_date, paid_date, sent_at
5. **payments** — invoice_id (FK), amount, payment_method, payment_date, notes
6. **settings** — user_id, key, value (replaces localStorage settings)

All tables get RLS policies scoped to the authenticated user.

**Phase 2 — Quote-to-Job Workflow**

- "Accept & Create Job" button on QuoteView when status is "accepted"
- Auto-generates a job number (MGS-001, MGS-002, etc.)
- Job detail page showing linked quote, scheduling, and status progression

**Phase 3 — Invoicing**

- Generate tax invoice from a completed job (auto-populates from job/quote data)
- Invoice view page with ABN, GST breakdown, payment terms
- Invoice status tracking (unpaid → sent → paid/overdue)
- "Send Invoice" button using existing email infrastructure

**Phase 4 — Payment Tracking**

- Record payments against invoices (partial or full)
- Payment history per invoice
- "Request Payment" email using existing unpaid-invoice template
- Overdue detection based on due_date

**Phase 5 — Job History & Calendar**

- Jobs list page with filters (status, date range, client)
- Calendar view showing scheduled jobs and due invoices
- Weather forecast widget for upcoming job dates (using free weather API)

**Phase 6 — Dashboard Upgrade**

- Revenue forecast based on accepted quotes and scheduled jobs
- Overdue invoices alert
- Upcoming jobs this week
- Monthly revenue chart

### New Pages & Routes

| Route | Page |
|-------|------|
| `/admin/jobs` | Job list with filters |
| `/admin/jobs/:id` | Job detail view |
| `/admin/invoices` | Invoice list |
| `/admin/invoices/:id` | Invoice detail/print view |
| `/admin/calendar` | Job calendar |

### Navigation Update

Add to AppLayout nav: Jobs, Invoices, Calendar (alongside existing Dashboard, New Quote, Materials, Tools, Settings).

### Technical Details

- **Database migration**: Single migration creating all 6 tables with RLS policies, auto-increment job/invoice number functions
- **Data hooks**: Replace `useQuotes` localStorage with Supabase queries; create `useJobs`, `useInvoices`, `usePayments` hooks using React Query
- **Job number generation**: Database function using a sequence (MGS-001 format)
- **Invoice number generation**: Similar sequence (INV-001 format)
- **GST handling**: 10% GST calculated and displayed separately on invoices
- **Weather**: Free Open-Meteo API (no key needed) for 7-day forecast at business location
- **Calendar**: Simple month/week view using existing UI components

### Migration Strategy

Data currently in localStorage will not be migrated automatically. New quotes will go directly to the database. The user can recreate any important existing quotes.

