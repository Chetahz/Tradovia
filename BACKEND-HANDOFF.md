# Backend integration status — 2026-09-15

## 2026-10-07 production data safety pass

- Read-only D1 consistency audit passed with zero orphan account, trade, connection, credential, profile, subscription, or invalid-JSON records.
- A complete schema/data-separated D1 snapshot plus every referenced private R2 object was downloaded to the Git-ignored backup area and hashed.
- The snapshot was restored into an isolated local D1 database; `PRAGMA integrity_check` returned `ok`, and the restored totals matched production: 16 users, 361 trades, and 1 image record. The R2 file checksum also passed.
- Fresh demo initialization now persists demo Playbooks and Daily Check-ins, so editing a seeded trade does not fail with `Playbook is unavailable`.
- Saving or deleting a trade now releases image metadata and the private R2 object after its final trade reference disappears. Demo reset purges all known trade images plus the avatar.
- Production integration tests passed after deployment: persisted CRUD, cross-session isolation, cross-origin rejection, private-image isolation, and image release after detaching.
- Cloudflare Worker version: `42b057f0-39fd-4dce-bfc4-61687900f326`.

Cloudflare test deployment: https://tradovia-app.rachatakaewthong.workers.dev

- Worker `tradovia-app` deployed with D1 `tradovia-db` and private R2 `tradovia-images` bindings.
- D1 migrations 0000, 0001 and 0002 applied remotely. Do not recreate these resources.
- Auth0 Tradovia application uses the workers.dev `/auth/login`, `/auth/callback`, and `/auth` logout return URLs. Settings verified after reload.
- Vercel `tradovia-preview.vercel.app` now redirects `/auth/*` and `/workspace/*` to the real Cloudflare backend. Landing and `/demo` remain static. Vercel project is `prj_OAYVmCrGGHSsVd52tVGyLykLymV6`; do not deploy to the separate `tradovia` project by mistake.
- Build, TypeScript and 24 unit tests passed.
- Remote demo integration tests passed: CRUD/persistence, session isolation, cross-origin rejection, private images.
- Synthetic local authenticated-account integration test passed, including server-assigned Owner and logout revocation.
- Local Wrangler sometimes returns `Your worker restarted mid-request` (503) for the cross-origin POST test. The same test passes remotely. Local watch-directory adjustment did not resolve this; do not mask it with automatic retries.

## Auth status and remaining work

1. User explicitly approved transferring the Auth0 Client Secret to Cloudflare. `AUTH_CLIENT_SECRET` was saved through the Cloudflare secret UI and its name verified with Wrangler. Never print or commit its value.
2. `AUTH_SESSION_SECRET` has been generated with crypto.randomBytes(32) and stored directly as a Cloudflare secret without printing or writing its value to a file. Do not regenerate either secret on resume.
3. Login reaches Auth0 Universal Login successfully. Callback mismatch was corrected in Auth0. User completed first login and reached workspace; auth_sessions contains their verified identity. Successful callback and profile persistence after reload are verified. Real browser logout tested successfully: native POST returns to `/auth`, subsequent `/workspace` returns to `/auth`, and sign-in presents Auth0 again. User must sign in again after this test.
4. User completed verified login. Their Auth0 subject was read from auth_sessions and saved as AUTH_OWNER_SUBJECT (exact bytes via Node stdin). Settings visibly confirmed ELITE · owner. Profile Chetahz persists after reload. Sidebar derives its label from subscription. Never automatically grant Owner to the first signup.
5. Review paid-feature enforcement and integrate billing separately before advertising paid access as complete.

Local fixture files under `.wrangler/` contain synthetic credentials and are excluded from Git. They must never be deployed as runtime configuration.

## 2026-09-16 connection and login UI

- Added Tradovia forest/mint responsive login gateway; checked 390px mobile layout.
- Auth0 Universal Login uses the Tradovia logo and brand colors; sign-up and sign-in routes verified in the browser without creating extra accounts.
- Workspace logout uses a native POST form rather than client-side route navigation.
- Vercel CLI connection explicitly authorized by user; credentials managed by the CLI, never committed.
- TypeScript and 4 focused auth tests passed. Vercel production build passed. Main-site redirects return 307, unauthenticated real workspace API returns 401.
- Updated landing FAQ to explain real server-backed accounts and separate demo.
- Billing/Stripe and a full paid-feature audit are separate remaining work; do not describe paid subscriptions as ready.
