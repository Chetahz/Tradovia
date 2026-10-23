# Tradovia Phase 1 — Brand Foundation

Status: implementation complete. Vercel Preview and Cloudflare Worker deployed after user approval. Phase 2 has not started.

## Deployment follow-up — 2026-09-22

- Vercel Preview: https://tradovia-preview-hfnlbywjp-rachatakaewthong-4263.vercel.app (Ready). The Vercel production alias was not promoted.
- Cloudflare Worker: https://tradovia-app.rachatakaewthong.workers.dev
- Worker version: `7839da29-b829-4041-a5f7-9dc766314242`.
- Deployed the verified `dist/server/wrangler.json` build with `--keep-vars`; no database migrations or secret changes.
- Live login and demo title: `Tradovia — Your Trading Workspace`; live logo computed color: `rgb(0, 239, 211)`.
- Login gateway demo link opened the populated demo successfully, with no captured console errors.
- Unauthenticated `/workspace` returned to `/auth`; sign-in reached Auth0 Universal Login with its password field present.
- Authenticated callback/logout were not repeated with a real user account in this deployment check. Auth0-hosted page branding remains separate from the deployed Tradovia gateway.

## Locked source of truth

- Primary brand color: `#00EFD3` (`rgb(0, 239, 211)`).
- Logo geometry: `assets/brand/tradovia-approved.png`, copied byte-for-byte from the approved standalone PNG. The SHA-256 hash matches the supplied source.
- Wordmark: the existing lowercase `tradovia` presentation remains unchanged. No replacement wordmark or alternate T was drawn.
- Current positioning: “Trading Workspace”. “Trading Operating System” is no longer used in the active app, preview, or metadata source.

## Files changed in Phase 1

| File | Phase 1 change |
| --- | --- |
| `app/design-tokens.css` | Added palette, semantic, component, Light/Dark, trading outcome, chart, focus, media and Auth story tokens. |
| `app/globals.css` | Imported the token source and replaced legacy brand color literals with role-based tokens without changing layout dimensions. Added token-based focus treatments. |
| `app/layout.tsx` | Updated public metadata to “Tradovia — Your Trading Workspace” and the current workspace description. |
| `app/page.tsx` | Replaced hard-coded equity-curve greens and changed the public positioning copy to Trading Workspace in EN/TH. |
| `components/account-report.tsx` | Moved equity chart color to `--chart-equity`. |
| `components/workspace-ui.tsx` | Moved chart color to `--chart-equity`; separated Long/Short presentation from Profit/Loss tokens. |
| `components/workspace.tsx` | Updated the sidebar descriptor to Trading Workspace in EN/TH. No workspace orchestration or trading logic changed. |
| `preview/auth.css` | Replaced the remaining legacy forest shadow with the shared shadow token. |
| `preview/index.html` | Set neutral charcoal browser chrome color. |
| `preview/main.tsx` | Moved the demo notice colors to semantic accent tokens. |
| `public/manifest.webmanifest` | Updated description and neutral browser/app shell colors while retaining the existing icon paths. |
| `assets/brand/tradovia-approved.png` | Stored the approved standalone source artwork unchanged. |
| `public/brand/tradovia-mark-primary.png` | Generated transparent primary-color mark from the approved source pixels. |
| `public/brand/tradovia-mark-white.png` | Generated transparent white mark with the same alpha geometry. |
| `public/brand/tradovia-mark-black.png` | Generated transparent black mark with the same alpha geometry. |
| `public/brand/tradovia-mark.svg` | Updated to a lightweight SVG wrapper around the approved raster-derived mark. It is deliberately not an auto-traced vector. |
| `public/favicon.svg` | Aligned the favicon with the approved mark and neutral charcoal tile. |
| `public/brand/icon-180.png` | Regenerated the app icon from the approved mark. |
| `public/brand/icon-192.png` | Regenerated the app icon from the approved mark. |
| `public/brand/icon-512.png` | Regenerated the app icon from the approved mark. |
| `scripts/brand-assets.cjs` | Replaced the former hand-authored path generator with deterministic matte removal/recoloring from the approved PNG; includes a hard guard for `#00EFD3`. |

## Remaining literal colors and why they remain

- `app/design-tokens.css`: these are the centralized palette and semantic definitions. Brand, trading outcomes, feedback states, and chart categories are intentionally separate.
- `public/manifest.webmanifest` and `preview/index.html`: `#1a1a1a` is neutral browser chrome and `#f7f9f8` is the light app canvas, not alternate brand greens.
- `scripts/brand-assets.cjs`: `#00EFD3`, white, black, and charcoal are explicit asset-output invariants.
- `components/ui/chart.tsx`: `#ccc` and `#fff` occur only inside selectors that catch Recharts-generated SVG defaults and remap them to semantic tokens. They are not rendered brand values.
- Generated PNG/SVG artwork contains raster pixel data from the approved source. No alternate brand green remains in active CSS outside the token source.

## Verification

- Production build: pass (`vinext build`).
- Static preview build: pass (`vite build`).
- Typecheck: pass (`tsc --noEmit`).
- Unit tests: pass, 24/24.
- Browser: pass for Landing at 1280px and Journal at 390×844; no horizontal document overflow or error overlay in the verified preview.
- Light/Dark: both render; primary resolves to `#00EFD3` and Dark mode keeps the mint as a restrained action/accent color.
- TH/EN: both render; verified `บันทึกการเทรด` and `Trade Journal`.
- Add Trade mobile: dialog stays inside the viewport and the Lot field preserves `0.01`.
- Logo: browser-computed mark color is `rgb(0, 239, 211)`.
- Favicon: loads as the approved Tradovia image.
- Source scan: no active-source matches for the audited legacy forest/chart values or “Trading Operating System”.
- Layout declaration comparison: no size, spacing, grid, flex, position, overflow, transform, or radius declarations changed during the token migration.

## Known findings and risks

- Lint is not green: 28 existing errors remain across unrelated navigation, hook, accessibility, preview-auth and test files. None were introduced to implement Phase 1; fixing them would expand this brand-only phase.
- The existing local Worker integration suite previously reached 3/4 passes; the final billing request failed when Wrangler restarted mid-request. CRUD, image isolation, account isolation and logout checks passed. This is a local Worker/runtime issue outside the brand scope.
- Starting the production build directly with Node cannot serve Cloudflare-bound workspace APIs (`cloudflare:` modules). The standalone preview build was therefore used for the complete workspace UI check.
- A raster source cannot become a genuinely scalable vector without redrawing or tracing. The SVG asset intentionally wraps a high-quality raster-derived mark to preserve the approved geometry. A future official SVG can replace it without changing consumers.
- The Auth0 hosted Universal Login branding was not remotely changed or deployed in this phase. Local Tradovia auth surfaces inherit the new token foundation.
- Existing bundle-size warnings remain for client chunks over 500 kB. They predate this brand task and do not block the build.
- The repository already contained unrelated backend/auth changes before Phase 1. They were preserved and are not part of this report.
