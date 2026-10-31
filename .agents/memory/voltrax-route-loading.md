---
name: Lazy route transitions
description: Avoid full-screen loading flashes and missing shared navigation styles when public routes are code split.
---

With lazy-loaded public routes, keep the Suspense boundary stable instead of keying the route subtree by pathname. Use React Router transition navigation so the current page remains visible while a new route module resolves. Keep shared navigation CSS colocated with the navigation component rather than in the lazy-loaded homepage stylesheet.

**Why:** Keying the route tree caused the full-screen loading fallback to replace the page on every navigation. Loading shared navigation styles only with the homepage also left direct links to other routes unstyled.

**How to apply:** When changing public route splitting, preserve the transition behavior and avoid pathname keys around Suspense. Keep navigation styles in the navigation component's stylesheet so direct route loads and refreshes render consistently. Do not re-fetch license status on every pathname change; refresh it on app start, explicit access changes, and expiry. Start loading the requested route module alongside the access check, without rendering protected content early.

**User-confirmed performance behavior (2026-10-11):** The user confirmed that navigation felt fast after frequently used route modules were warmed during browser idle time.

**Why:** The user noticed this improvement directly in the preview, so removing route warming for a small bundle-size gain could reintroduce the reported click delay.

**How to apply:** Preserve idle prefetching of common routes and pointer/focus prefetching when refactoring lazy route loading; measure the effect before changing this behavior.