# Daily-use product pass — 2026-09-24

## Production data safety — implemented 2026-10-07

- Added a read-only production consistency audit for ownership relationships, required user rows, and stored JSON validity.
- Added a D1 plus referenced-R2 backup command with checksums and an explicit completion marker.
- Added a restore rehearsal that imports only into an isolated local D1 database, verifies SQLite integrity and all downloaded R2 checksums, and never writes to production.
- Trade image records and R2 objects are released when the final saved trade reference is removed; demo reset now includes all known trade images and the avatar.
- Operational procedure and the non-destructive production replacement strategy are in `OPERATIONS-RUNBOOK.md`.

## Daily Review Loop — shipped 2026-10-07

- The Overview review inbox now guides one unfinished trade through three short touch-first steps: plan adherence, decision emotion, and one lesson to repeat or improve. A review is only completed after a lesson is saved.
- Saved lessons continue into the existing Lesson Recall, Edge, weekly review, and deep-analysis surfaces; the quick flow does not replace the full checklist and chart review.
- Settings now includes an optional in-app daily review reminder with account timezone, chosen time, overnight quiet hours, and an explicit off switch. It does not encourage additional trading and does not claim background push delivery.
- Reminder input is validated server-side and stored with the user's profile. The unread prompt is shown only after the chosen time and outside quiet hours.
- TypeScript, focused lint, 70 unit tests, production build, and live 390px browser verification passed. Published on Cloudflare Worker version `68093d81-7abe-4514-9f73-229f5d6483b0`.

## Shipped

- Overview/Today recalls the most recently completed review with a non-empty lesson, within the selected portfolio. The user's own words link back to the source trade. No generated advice, profit-based ranking, or placeholder lessons.
- Mobile Today shows the count of open entries when today's entries are all open, instead of presenting $0 as a realized result. Existing three-step capture and navigation stay intact.
- TypeScript and 28 unit tests passed; focused lint passed; full Cloudflare build passed. Browser checks covered 375/390/393/430 widths, Thai dark and English light presentations, desktop, and the lesson-to-detail action. Physical devices remain untested.
- Cloudflare version: `eed56ba0-4101-4af3-89f3-032e5e10785e`.
- Vercel production alias: `https://tradovia-preview.vercel.app`; deployment `https://tradovia-preview-99szl79af-rachatakaewthong-4263.vercel.app`.
- Existing live demo sessions may have no completed reviews. In that state the lesson section is deliberately absent; historical data was not reset to showcase it.

## Next priorities (proposals, not shipped)

1. Observe 5–10 target traders recording and reviewing their own trades on physical iOS/Android devices. Measure time to first saved trade, abandoned steps, and whether they return to a saved lesson. Define improvements from observed friction.
2. Unfinished new entries now save on this browser, scoped by environment and the workspace's account IDs. Add Trade offers Continue, Start new, or Not now. Numeric values and the mobile step resume; image references are excluded; successful creation and sign-out clear the active draft, while editing an existing trade leaves it intact. Drafts expire after 30 days. Browser flow was checked with lot `0.01`, refresh, resume, save, and fresh start. Cross-device sync and physical-device keyboard testing remain open.
   - Published on Cloudflare as version `d598e6f9-a82a-4ec7-91b9-6885d61426d3` and on `https://tradovia-preview.vercel.app` through deployment `https://tradovia-preview-cujinzhqc-rachatakaewthong-4263.vercel.app`.
3. Optional review reminders: user-chosen time and timezone, quiet hours, easy disable, no prompts to place more trades. Start with the existing in-app channel; external push needs a separate implementation and opt-in.
4. Improve capture/import from actual usage evidence. MT5 report import already exists; audit import errors and duplicates before adding broker integrations or claiming automatic sync.
5. Before paid launch, finish the existing server-side entitlement/billing audit, persistence and isolation checks, export/recovery flow, and production monitoring. Do not claim paid subscriptions or universal broker sync are ready.

Product positioning to validate: a lightweight journal that brings your own lessons back into your daily routine. User growth and competitive superiority are hypotheses to test, not claims established by UI work.

## Mobile capture QA — 2026-09-25

- The Add Trade dialog now follows the visible mobile viewport when a soft keyboard reduces it, and scrolls the focused input above the sticky action bar. The numbers step also keeps a 20px gap before that bar on short screens.
- Browser checks covered 375, 390, 393, and 430px widths without horizontal overflow, plus a 390×500 short viewport and Thai/English light/dark presentations. The English calendar now uses singular “1 trade” and localized day accessibility labels.
- TypeScript, 31 unit tests, preview build, and production Worker build passed. Focused lint for `trade-forms.tsx` passed; `trading-tools.tsx` still reports three pre-existing effect/dependency lint errors outside the changed calendar lines.
- Published on Cloudflare Worker version `25575cb1-aa2a-4eda-bfe5-b284f174ad6b` and `https://tradovia-preview.vercel.app` through deployment `https://tradovia-preview-pmf09sni7-rachatakaewthong-4263.vercel.app`.
- Physical iOS and Android keyboard, safe-area, and one-handed tests remain open. Browser viewport emulation cannot establish those results.
