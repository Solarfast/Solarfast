---
name: VOLTRAX battery animation masking
description: How the fill animation in HoeWerktHetPage is correctly clipped to the white panels only
---

## The permanent two-layer approach

### Layer 1: WebP alpha mask on the fill wrapper
- `mask-image: url(/alphaess-battery.webp)` with `mask-mode: alpha` (explicit!)
- `mask-size: cover` + `mask-position: center center` + `mask-repeat: no-repeat`
- The WebP (VP8X format, ALPH chunk confirmed) has true alpha transparency outside the battery body
- This clips the fill wrapper to the **EXACT battery body shape**: vertical bounds, rounded corners, bottom edge
- Prevents any bleed below or outside the battery outline
- zIndex: 2 (on top of the battery photo at zIndex: 1)

### Layer 2: Pixel positioning inside the mask
- Fill div: `left: 55px, right: 8px` (NOT percentages — pixels avoid rounding drift)
- Container = 150px wide; white panels = x62–142px; transition zone = x48–62px
- Starting at 55px covers the full visually-white zone while leaving the dark grey rail (x8–48px) unfilled
- Reserve line: same `left: 55px, right: 8px`, positioned at `top: ${100 - RESERVE_PCT}%`

### What NOT to use
- **SVG mask-image**: Chrome blocks external SVG masks (CORS-like restriction) — fill bleeds everywhere
- **clip-path: inset()**: Only clips rectangles — doesn't respect battery body's rounded corners at bottom → fill sticks out below battery
- **PANEL_LEFT %**: % rounding causes grey overlap or white panel gaps session after session

### Z-index order (critical!)
- Photo (`<img>`): `zIndex: 1` — background layer, always visible
- Fill wrapper (with WebP mask): `zIndex: 2` — overlay on top of photo
- If reversed (photo at 2, fill at 1), the opaque white panel pixels in the photo COVER the fill → fill invisible

### Fill animation
- `scaleY: pct/100` + `transformOrigin: 'bottom'` (NOT height-based — avoids top-edge artefact)
- `opacity: 0.48`, no mix-blend-mode (plain opacity avoids dark tint on grey transition zone)

**Why:** Multiple failed approaches (PANEL_LEFT %, SVG mask, clip-path) — the webp alpha mask is the only approach that handles both the battery body shape AND allows horizontal precision inside.
