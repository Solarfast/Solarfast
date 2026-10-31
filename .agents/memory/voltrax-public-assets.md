---
name: VOLTRAX public asset imports
description: Why importing files from public/ via the @assets JS alias fails in this Vite project, and the correct way to reference them.
---

Vite refuses to `import x from '@assets/foo.png'` when `@assets` resolves into the `public/` folder — it throws "Assets in public directory cannot be imported from JavaScript." Files placed in `VOLTRAX/frontend/public/assets/` must instead be referenced as plain URL strings served from the site root, e.g. `<img src="/assets/foo.png" />`, with no import statement.

**Why:** `public/` is copied verbatim and served at `/`, so Vite's bundler-import resolution (which needs a real module graph entry) doesn't apply to it; only `src/assets/...` files can be `import`-ed.

**How to apply:** When adding new static assets (logos, images) dropped into `public/assets/`, reference them directly as `/assets/<file>` path strings in JSX/CSS, not via `@assets` import. Use `@assets` imports only for files actually placed under `src/assets/`.
