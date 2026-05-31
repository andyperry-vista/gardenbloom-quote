## Goal

On mobile, the admin portal opens to a new **Contact Card** menu screen — a polished digital business card with the business's contact details, shareable via QR, vCard download, and native share sheet. Desktop admin behaviour is unchanged.

## Behaviour

- New route `/admin/card` rendered inside the existing admin layout (auth-guarded).
- On mobile only, visiting `/admin` redirects to `/admin/card`. Desktop continues to land on the existing Dashboard.
- Card screen shows the business defaults:
  - Mayura Garden Services + tagline
  - Nick — 0413 806 551
  - nicholas@mayuragardenservices.com.au
  - ABN 22 046 912 532
  - Website + WeChat QR (reuse `/wechat-qr.jpg`)
- Actions on the card:
  - **Save to contacts** — generates a `.vcf` (vCard 3.0) and triggers download.
  - **Share** — uses `navigator.share` when available (sends link + vCard), falls back to copy-link toast.
  - **Show QR** — large QR encoding the vCard URL / website for someone else to scan.
  - Tap-to-call and tap-to-email shortcuts.
- "Open full dashboard" link at the bottom so admins can still reach `/admin/dashboard`-style views.
- Add a "Contact Card" entry to the mobile bottom nav so it's reachable after navigating away.

## Visual direction

- Forest green (#052A1D) background with subtle gold (#BFA358) gradient sheen — looks like a premium collectible card, not literally an NFT.
- Horizontal Mayura logo at top, Great Vibes accent flourish, DM Sans body.
- Rounded-2xl card with soft shadow, gold hairline border, holographic gradient highlight on hover/tilt (CSS only, no extra libs).
- Action buttons: primary gold "Save contact", outline "Share", ghost "Show QR".

## Technical notes

- New file `src/pages/AdminCard.tsx` + small `src/lib/vcard.ts` helper that builds and downloads a vCard blob.
- QR rendering via existing `/wechat-qr.jpg` for WeChat plus a generated QR for the vCard — add lightweight `qrcode` npm package (no API key needed) and render to `<canvas>`.
- Route added in `src/App.tsx` (lazy-loaded).
- Mobile redirect handled inside `Dashboard.tsx` (or a tiny wrapper) using existing `useIsMobile()` hook + `<Navigate to="/admin/card" replace />` when mobile.
- Extend `MobileBottomNav` with a "Card" tab (replace or add alongside an existing one — will keep 5 tabs, swap "Clients" → "Card" to stay at 5).
- No DB / backend changes. No new secrets. No changes to business logic.

## Out of scope

- Real blockchain NFT minting / wallet connect.
- Per-user editable card fields (uses business defaults only).
- Changes to agent or employee portals.
