# Responsive Test Checklist — iPhone Sizes & Notch

Quick checklist for verifying the landing page (and any new screens) across common iPhone viewports, with attention to safe-area / notch behavior.

## Viewports to test

| Device                          | CSS width × height | Notes                              |
| ------------------------------- | ------------------ | ---------------------------------- |
| iPhone SE (2nd/3rd gen)         | 375 × 667          | Smallest modern, no notch          |
| iPhone X / XS / 11 Pro / 12 mini| 375 × 812          | Notch                              |
| iPhone 12/13/14/15              | 390 × 844          | Notch / Dynamic Island             |
| iPhone XR / 11 / 14 Plus        | 414 × 896          | Larger notch device                |
| iPhone 14/15 Pro Max            | 430 × 932          | Largest, Dynamic Island            |
| Smallest legacy (iPhone 5/SE1)  | 320 × 568          | Stress test for cramped layouts    |

In Lovable, switch sizes via the device button above the preview, or in the browser tool with `set_viewport_size`.

## Checks per viewport

### Notch / safe area
- [ ] Language toggle (top-left) sits **below** the notch — uses `env(safe-area-inset-top)`.
- [ ] No primary content (logo, CTAs, "Return to homepage") is hidden behind the notch.
- [ ] Footer respects `env(safe-area-inset-bottom)` on home-screen PWA.
- [ ] Installed PWA opens at `/` (see `public/manifest.json` `start_url`).

### Hero
- [ ] Stacked logo scales without overflow; no horizontal scroll.
- [ ] Tagline wraps cleanly (no orphan single words on largest line).
- [ ] All four CTA buttons (Quote / Call / Email / WeChat) are full-width on mobile and tappable (≥44px tall).

### Sections
- [ ] Before/After reveal slider is usable with thumb (drag works near edges).
- [ ] Service cards stack 1-col on <640px, 2-col ≥640px.
- [ ] Share buttons wrap rather than overflow.
- [ ] Quote form inputs are full-width; address autocomplete dropdown is not clipped.
- [ ] Footer links (Agent / Admin / Webmaster) wrap onto one or two centered rows.

### Interaction
- [ ] No element requires horizontal scroll.
- [ ] Tap targets are ≥44×44 CSS px.
- [ ] Modals (WeChat dialog) fit within the viewport with internal scroll if needed.

## Last verified

- 2026-05-11 — 375×812, 390×844, 414×896 all rendered correctly. Language toggle clears the notch; hero CTAs and gallery visible above the fold.
