# Tradovia mobile product UX audit — 2026-09-23

Scope: authenticated workspace and demo, same routes/components/data. Landing is approved and outside this redesign.

## Current screens and disposition

| Screen / flow | Current mobile state | Decision | Mobile destination |
| --- | --- | --- | --- |
| Workspace shell and navigation | Five tabs plus desktop-style header/sidebar; Calendar, settings and account are buried | MOBILE RECOMPOSE | Four primary destinations: Today, Journal, Calendar, Insights; persistent Add action; More sheet for all other screens |
| Overview / Home | Review panel, four metrics, equity, focus card, recent table stacked from desktop | MOBILE RECOMPOSE | Today command center: account, today's result, weekly progress, next action, one recent trade, one insight. Full overview remains on desktop |
| Add/Edit trade | Mobile-only step visibility exists, but one desktop form and import tabs remain in the flow; hidden required fields and quick-save ambiguity | MOBILE RECOMPOSE / FULL-SCREEN MOBILE DETAIL | Trade → Numbers → Context; large controls, accessible progress, clear validation, save basic trade after required numbers; editing preserves all values |
| Journal / trade history | Quick Review, table/gallery switch, filters and mobile cards coexist in one long page | MOBILE RECOMPOSE | Search/filter and trade cards first; Quick Review and Gallery entered from compact actions |
| Trade detail | Full data in a responsive dialog | FULL-SCREEN MOBILE DETAIL | Full-screen view, concise result header and progressive sections; same data/edit/delete controls |
| Calendar | Monthly/week/year calendar already functional; cell details and weekly totals crowded at phone widths | MOBILE RECOMPOSE / BOTTOM SHEET | Compact month with day P&L/activity; tap day for full-screen/day sheet with trades and review |
| Analytics overview | Four metrics, chart, outcome donut and two breakdowns stacked from desktop | MOBILE RECOMPOSE | Compact summary, one primary chart, segmented Overview/Days/Symbols/Setups; deep/report/weekly behind secondary controls |
| Deep Analysis, Weekly Review, Account Report | Rich desktop analysis/report pages | MOVE TO SECONDARY FLOW | Accessible through Insights More/detail; preserve full data and exports |
| Playbooks | Rich strategy management and checklist | POLISH / MOVE TO SECONDARY FLOW | More → Playbooks; compact cards/checklist; edit in full-screen detail |
| Risk Center | Position sizing calculator and explanation | POLISH / MOVE TO SECONDARY FLOW | More → Risk calculator; keep complete calculations, simplify first viewport |
| Goals & Rules | Three large goal cards then rules | MOBILE RECOMPOSE | More → Goals & Rules; compact progress rows and tappable rules |
| Market | Chart/watchlist feature | PRESERVE / MOVE TO SECONDARY FLOW | More → Market; chart remains available, adapt controls as needed |
| Portfolio | Portfolio/account management | PRESERVE / MOVE TO SECONDARY FLOW | More → Accounts; selector also on Today |
| Broker connections / imports | Setup/admin workflows | MOVE TO SECONDARY FLOW | More → Connections / Import; avoid primary nav |
| Settings / profile | Existing mobile drawer direction is useful | POLISH / MOVE TO SECONDARY FLOW | More → Settings/Profile, including language, theme, export, sign out |
| Gallery | Existing gallery inside Journal | POLISH / MOVE TO SECONDARY FLOW | Journal action → Gallery, with full-size image viewer |
| Misc forms and confirmations | Generic dialogs | BOTTOM SHEET / FULL-SCREEN MOBILE DETAIL | Use task-sized sheet; retain all validation and data |

## Mobile information architecture

- **Today**: account selector, today P&L and activity, recent trade, progress and one next action. Add Trade is one tap.
- **Journal**: search and status filters, native cards; secondary Quick Review and Chart Gallery. Trade detail opens full screen.
- **Calendar**: month at a glance, tap a day to open day detail.
- **Insights**: short performance summary and chart; segmented views for Days, Symbols and Setups. Deep Analysis, Weekly Review and Account Report are secondary entries.
- **More**: Playbooks, Goals & Rules, Risk Center, Market, Portfolio, Connections, Import, Settings/Profile and export. Nothing is removed.

Desktop keeps the current navigation and dense views. Mobile components read the existing workspace data and call the existing mutations. The launch point is the same `/workspace` or `/demo` route, so future iOS/Android wrappers can reuse product routes while progressively replacing platform controls.

## Implementation and acceptance order

1. Shell and Today.
2. Add Trade and Trade Detail.
3. Journal and Calendar.
4. Insights and secondary destinations.
5. Goals, Rules and settings polish.

At each stage test 375/390/393/430 CSS-pixel widths, Thai/English and light/dark modes. Check direct routes, empty states, focus/keyboard, touch targets and modal scroll locking. Verify desktop views separately. Existing data and backend contracts remain authoritative.

## Implementation check — 2026-09-23

- Done locally: four-destination bottom navigation, persistent Add action, More sheet, mobile Today with live workspace data, and compact Analytics result summary. The existing desktop Overview and analytics metrics remain available on desktop.
- Done locally: Add Trade keeps its full-screen three-step flow, now reports validation errors when the quick-save action is used with incomplete data; a new mobile trade starts OPEN, so a quick capture is not falsely counted as a realized $0 closed trade. Decimal `0.01` was entered and saved in the browser preview.
- Done locally: mobile Journal moves import/export to More, and calendar day detail was checked on a phone-sized viewport. Large onboarding panels no longer push the primary content below the first screen on mobile.
- Browser-checked: 375, 390, 393 and 430 CSS-pixel widths; Thai/English; light/dark; Today, Add Trade, Journal, Analytics, Calendar day detail, and More. Desktop Overview checked at 1280px. These are browser previews, not physical iOS/Android device tests.
- Still open for mobile UX: physical-device and assistive-technology testing, plus complete polishing of the secondary screens. Native app packaging and store submission are a future phase and are outside this UX pass.

## Interaction refinement — 2026-09-24

- The persistent Add Trade action now occupies the center of the five-item bottom bar with a text label. It no longer floats over content or sits at the far-right edge. The secondary destinations are reached through a labelled Menu control in the top bar.
- Today now uses an action-oriented empty state when no trade has been recorded today, instead of giving a prominent $0.00 result. Once trades exist, the card shows the actual closed-trade result. A compact plan-adherence progress indicator uses reviewed trade data; it is omitted when there are no reviewed trades.
- Journal puts trade history, search and chart gallery ahead of the review panel on mobile. A small review cue above the list links directly to the review panel. Desktop retains its review-first ordering.
- The Add Trade form fills the phone viewport and anchors its next-step action at the bottom when the step content is short. Existing users with recorded trades see the large getting-started guide collapsed by default; it can be reopened.
- Verified in the browser at 375, 390 and 430 CSS-pixel widths, Thai/English and light/dark; the center Add action, full-screen form, Menu, Journal review shortcut and desktop layout were exercised. TypeScript, focused lint, 24 domain/auth tests, preview build and full Worker build passed.
- Published to `tradovia-preview.vercel.app` and Cloudflare Worker `tradovia-app` version `f4f91edd-4c96-421b-899c-c72394198433`. The Worker build used the production D1/R2 bindings, no fixture bindings, and deployment kept Dashboard variables/secrets. Live demo Add was checked; unauthenticated `/workspace` still redirects to `/auth`. An authenticated account session and physical iOS/Android devices were not available for this pass.
