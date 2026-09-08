# Tradovia

A working trading workspace built from the approved Tradovia baseline. The implementation includes a landing page, isolated interactive demo, protected private workspace, trade journal with images, calendar, analytics, position sizing, goals and rules, portfolios, manual accounts, TradingView widgets, persistent watchlist, broker connection preparation, profile and billing controls. English and Thai, light and dark themes, and mobile layouts are included.

## Run locally

Node 22.13+ and pnpm are required.

```sh
pnpm install
pnpm dev
```

Open `/demo` for the interactive demo or `/auth` for private workspace sign-in. Local Sites development supplies a development identity; it is not a public authentication service. Deployments use the Sites identity dispatcher and protect `/workspace` and real-data APIs. Demo sessions use separate HTTP-only cookies and separate database ownership keys, even for signed-in users.

For a fresh local database, apply the committed migration using Wrangler's local D1 mode against the `site-creator-d1` binding in your local configuration. Sites applies the bundled migrations when publishing. Never run the demo reset against real users; the API rejects that operation.

## Validation

```sh
pnpm build
pnpm lint
pnpm typecheck
pnpm test
# With local development server running:
node --test tests/api.test.mjs
```

13 tests pass across the two suites: journal mutations and reload persistence, shared calendar/analytics calculations, open-trade exclusion, drawdown, week boundaries, conservative position sizing across 1,000 generated cases, input validation, demo isolation, ownership checks, cross-origin rejection, private image upload access, persistent watchlist and Stripe signature verification. Browser checks cover desktop, ultrawide and mobile, both languages and themes, journal creation/editing, calendar, analytics, risk and TradingView. These checks do not constitute a live broker or live payment test.

Lint covers authored code. Untouched generated shadcn components and hooks are excluded by the starter-oriented ignore list. Production builds currently emit a large-chunk advisory for the workspace chart/component bundle.

## Data and calculations

Cloudflare D1 stores users, profiles, portfolios, accounts, trades, image metadata, goals, rules, broker connections, subscriptions, payments and webhook events. R2 stores private images served through owner-checked routes. Every query and mutation is scoped to the server-resolved owner. CSV exports the selected portfolio's trades; JSON exports the complete workspace.

Closed-trade net P/L is gross P/L minus fees. Calendar, dashboard, goals and analytics use these same records. Starting capital is the sum of the selected manual accounts. This release uses USD account values; it does not perform currency conversion or reconcile broker deposits and withdrawals. Trade dates and times are explicit journal values; timezone preference is displayed, not an automatic conversion of existing entries.

Position size rounds down to the configured lot step and includes entered fees/slippage allowance within the intended budget. Tick value must be expressed in account currency and matched to the actual broker contract. Execution gaps and real market slippage cannot be guaranteed by a calculator.

## Configure before public launch

### Public email/password and Google authentication

The private preview has functioning Sites sign-in and protected routes. Public email/password, Google and password reset are **not enabled**. `lib/identity-adapter.ts` defines the provider contract and security requirements; a concrete public identity adapter and callback/session wiring still need implementation for the chosen provider.

Create an identity-provider application with email/password, verified email, reset email delivery and Google enabled. Register a Google OAuth client and approved redirect URLs for the eventual domain. Supply the provider issuer, client ID and server-only secret (see `.env.example`). Then connect the adapter and verify registration, login, reset, logout, expiry and account linking end to end. Merely setting the placeholders does not enable these flows.

### Stripe

Server-side Checkout, Billing Portal, signed webhook processing, subscription state, renewal/cancellation display, paid-plan gating, invoice payment records and event idempotency are implemented. Billing stays unavailable when configuration is missing; demo cannot pay.

Create a Stripe account, Pro and Elite recurring prices, and configure Customer Portal. Set server-only `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, `STRIPE_ELITE_PRICE_ID` and canonical `APP_ORIGIN`. Register the implemented endpoint `/api/billing/webhook`. Subscribe to checkout completion, subscription created/updated/deleted and invoice paid/payment_failed events. Validate in Stripe test mode before using live credentials. Pricing on the landing page is proposed and is explicitly marked inactive.

### Broker synchronization

Choose a provider such as MetaApi, an MT5 bridge, or cTrader and obtain its application credentials and account authorization. `lib/broker-adapters.ts` contains the normalized provider contract and stable import identity; provider implementations, reconciliation jobs and provider-specific token storage must be connected next. The UI supports multiple prepared connections, disconnected/not-configured states and honest sync errors. No live synchronization is claimed or simulated.

### Hosting and operations

The preview uses Sites-managed D1 and R2. Configure domain ownership/DNS for Tradovia.com when public hosting is selected. Add production secret management, monitoring, backups/restore exercises, rate limiting, data export/deletion policy and scheduled cleanup of expired demo rows and orphan image objects before public scale. Demo reset currently removes database ownership records but does not purge orphan R2 objects. Email sender/domain verification is required for public account emails. TradingView widgets are external embeds with their own availability, delays and terms.

## Project structure

- `app/`: landing, auth, demo, protected workspace and server APIs.
- `components/`: connected workspace, forms, market, billing and responsive UI.
- `lib/domain.ts`: pure calculations and validation shared by UI and tests.
- `lib/server-auth.ts`, `lib/repository.ts`: ownership and D1 persistence.
- `db/schema.ts`, `drizzle/`: schema and deployable SQL migration.
- `.env.example`: configuration names only; never store secrets in source.
- `reference/approved-baseline.html`: original product reference, not the running app.

Implementation branch: `feat/tradovia-trading-os`.
