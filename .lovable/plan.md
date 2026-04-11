

## Plan: Streamline Admin Workflow — Quote-to-Job Flow & Unified Email Composer

### Problem
1. **QuoteView** imports a non-existent `mayura-logo.jpeg` (should be `.png`)
2. The **Business Tools** email section has separate manual forms for each template — no client picker, no PDF attachment, too many fields to fill by hand
3. The quote-to-job button works but is only visible on `draft`/`sent` — should be more prominent
4. Missing templates: "Booking Confirmation", "Rate & Review", "Tax Invoice"

### What Will Change

**1. Fix broken logo import in QuoteView**
- Change `mayura-logo.jpeg` to `mayura-logo.png` in `src/pages/QuoteView.tsx`

**2. Create a Quote PDF generator** (`src/lib/generateQuotePdf.ts`)
- Similar to `generateInvoicePdf.ts` — branded A4 PDF with quote details, line items, totals
- Returns a Blob (for download or potential future use) and also triggers download

**3. Add "Download PDF" button to QuoteView**
- Add a Download PDF button alongside the existing Send/Create Job buttons

**4. Rebuild Business Tools email section as a unified Email Composer**
Replace the 4 separate form tabs with a single smart form:
- **Step 1 — Pick scenario** from a dropdown: Sending Quote, Booking Confirmation, Payment Request, Payment Follow-Up, Job Completion, Rate & Review, Tax Invoice
- **Step 2 — Pick client** from a dropdown (populated from `useClients()` hook), which auto-fills the email address and first name
- **Step 3 — Optional notes** textarea for custom message content
- **Step 4 — Send** button that invokes `send-transactional-email` with the correct template name and pre-filled `templateData` (clientName from the selected client)
- The form will show which PDF would be relevant (quote or invoice) based on scenario, with a note that the PDF link is included in the email

**5. Create missing email templates**
- `booking-confirmation.tsx` — confirms a job booking with the client
- `rate-review.tsx` — asks client to leave a review after job completion
- `tax-invoice.tsx` — sends tax invoice details to client
- Update `registry.ts` to register all new templates
- Deploy edge functions after changes

**6. Keep GST/BAS section** unchanged in Business Tools

### Technical Details

- **Files modified:** `QuoteView.tsx`, `BusinessTools.tsx`, `registry.ts`
- **Files created:** `generateQuotePdf.ts`, `booking-confirmation.tsx`, `rate-review.tsx`, `tax-invoice.tsx`
- **No database changes needed** — all templates use existing data
- **Edge functions redeployed** after template changes
- The unified email composer uses `useClients()` for the client dropdown and `useQuotes()`/`useInvoices()` to optionally link a specific quote or invoice to the email context

