# Landing alignment — September 2026

Brand primary remains the approved `#00EFD3`. Neutral gray/charcoal surface tokens provide contrast in light and dark mode; profit/loss retain separate semantic colors.

The Landing now opens on an illustrative Calendar within a five-tab workspace preview. Overview, Journal, Calendar, Gallery, and Decision Quality are interactive examples. Calendar and Overview share one small trade dataset so counts, dates, win rate, R total, and profit factor agree. Gallery charts are illustrative SVGs and enlarge in an accessible dialog. The mobile capture walkthrough is illustrative and does not write trades; the CTA opens the real demo journal.

The tab composition follows the [Origin UI Tabs example on 21st.dev](https://21st.dev/@originui/components/tabs), marked MIT on that page. It uses the project's existing Base UI tab primitives and custom Tradovia styling. No third-party visual asset was copied. The data charts are authored in this project.

The static Vercel preview and the Cloudflare app share `app/page.tsx`, `components/landing-product-preview.tsx`, and brand tokens. This deployment changes the Landing UI; it does not alter authentication, trade persistence, or backend data.
