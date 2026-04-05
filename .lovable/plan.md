

## Plan: Landing Page + Admin-Protected Quote Tool

### Overview
Create a public-facing landing page for Mayura Garden Services at `/`, and move the existing quoting tool behind `/admin/*` routes protected by a simple password gate.

### 1. Update Logo Asset
Copy the new uploaded logo (`IMG_3007.png`) to `src/assets/mayura-logo.png` (replacing the existing one). This logo includes the full branding with "Maximising Property Value" tagline.

### 2. Create Landing Page (`src/pages/LandingPage.tsx`)
A professional marketing page with:
- **Hero section**: Full-width dark green background with the Mayura logo, headline "Maximising Property Value", and a brief value proposition about pre-sale garden styling
- **Services section**: Cards highlighting key services (garden styling, planting, mulching, lawn care, hedge trimming, clean-ups)
- **How It Works**: 3-step process (Consultation → Quote → Transformation)
- **Call to Action**: Contact details, phone number, email — encouraging potential clients to get in touch
- **Footer**: Business name, tagline, copyright
- Uses the existing forest green + gold color palette

### 3. Create Admin Login Gate (`src/pages/AdminLogin.tsx`)
- Simple password input form (no username needed)
- Checks against a hardcoded admin password stored as a constant (initially `"mayura2026"` — user can change it later)
- On success, stores auth state in `sessionStorage` so it persists during the browser session
- Styled to match the brand

### 4. Create Auth Guard (`src/components/AdminGuard.tsx`)
- Wrapper component that checks `sessionStorage` for admin auth
- If not authenticated, redirects to `/admin/login`
- Wraps all admin routes

### 5. Update Routing (`src/App.tsx`)
```text
/                    → LandingPage (public)
/admin/login         → AdminLogin
/admin               → Dashboard (protected)
/admin/quotes/new    → QuoteEditor (protected)
/admin/quotes/:id    → QuoteView (protected)
/admin/quotes/:id/edit → QuoteEditor (protected)
/admin/materials     → Materials (protected)
```

### 6. Update Internal Navigation
- Update `AppLayout.tsx` nav links to use `/admin/` prefixed paths
- Add a "Logout" button to the admin header
- Update all internal `<Link>` references in Dashboard, QuoteView, QuoteEditor to use `/admin/` prefixes

### Technical Details
- Password auth uses `sessionStorage` — clears on browser close
- No database tables needed for this simple admin gate
- All existing quote tool functionality remains unchanged, just moved under `/admin`
- Landing page is fully static, no data dependencies

