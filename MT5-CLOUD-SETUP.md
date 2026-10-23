# MT5 cloud sync: launch gate

The intended customer flow is: choose a journal account and exact MT5 broker server in Tradovia → open MetaApi's hosted credential page → enter MT5 account number and **investor password** there → return to Tradovia for status. Tradovia does not receive or store the broker password. The sync worker imports closed MT5 positions periodically without a Windows terminal. Do not describe this as guaranteed real-time or universal broker coverage.

## Current state

- The previous Windows Expert Advisor flow has been removed from the UI and routes. `drizzle/0003_mt5_credentials.sql` remains as an additive migration already applied to D1; it is unused by the cloud connector.
- `app/api/mt5/cloud/route.ts` and `lib/metaapi.ts` implement authenticated draft provisioning, hosted credential link, status and provider-side deletion on disconnect. The route is closed unless `METAAPI_TOKEN` exists **and** `MT5_CLOUD_ENABLED=true`.
- `workers/mt5-poller.ts` is the scheduled importer. It has passed a Wrangler dry run, but is **not deployed**. It uses a one-minute cron, incrementally backfills history, and deduplicates by MT5 position ID. Complex reversals and incomplete partial closes are not imported.
- A MetaApi account has been created and email verified. No API token, broker server or real MT5 account has been tested. This is **not sale-ready**.

## Account-specific pricing checked on 27 Sep 2026

MetaApi Billing currently shows the **paid** plan, USD $0.00 balance and no payment method. The account's London-region Rates page lists cloud-g2 high-reliability hosting at **USD $0.0126 per trading account per hour**, or about **USD $9.07 for 720 hours**, plus **USD $0.0756 per deployment**. Adding a unique trading account costs **USD $2.10** (once per month for the same MT5 platform, server and login combination). MetaApi API is listed at USD $0 per trading account per hour, inactive account hosting at USD $0.00105 per hour, and excessive repeated failed account-add attempts at USD $0.105 per attempt. Rates exclude VAT/GST and could change. Do not assume the paid plan or zero balance grants free production usage; verify the first real bill before deciding customer pricing.

MetaApi's public pricing page advertises a Regular subscription of USD $30/month, a one-time seven-day trial and one included MT account. The current account dashboard does **not** clearly show whether its trial or included-account allowance is active, so a demo-account test may or may not incur the line-item rates above. A broker demo account is still a hosted MT account for billing purposes. Do not create a hosted account until the owner accepts this uncertainty or MetaApi support confirms the account-specific allowance.

## Required before enabling customers

1. Create a MetaApi account and review its current plan, per-account and API-call charges. Use a dedicated test MT5 account at a broker, with an investor password. Do not put tokens or broker credentials into chat or the repository.
2. Generate a MetaApi API token with the minimum scopes needed for account provisioning, configuration link, account status, history read and account deletion. Store it as Cloudflare `METAAPI_TOKEN` secret on both `tradovia-app` and `tradovia-mt5-poller`.
3. Deploy `workers/mt5-poller.wrangler.json`; keep the app gate closed. Verify the cron trigger and D1 access. Configure the actual owner entitlement for the poller before paid rollout.
4. Test one real MT5 demo login end to end: create connection, hosted investor login, broker connected status, initial history import, new closed trade appearing after a cron run, partial close, replay deduplication, failure/retry, and provider account removal on disconnect. Check the actual delay and provider bill.
5. Decide policy for accounts whose subscription expires: stop the provider terminal or delete it so Tradovia is not billed indefinitely. Add quota and abuse controls for account creation and failed broker authentication. Validate broker-server compatibility with several brokers.
6. Only after those checks, set `MT5_CLOUD_ENABLED=true` on the app Worker and update pricing language to say the feature is available.

Official references: [MetaApi account creation](https://metaapi.cloud/docs/provisioning/api/account/createAccount/), [hosted credential link](https://metaapi.cloud/docs/provisioning/api/account/createConfigurationLink/), [deal history API](https://metaapi.cloud/docs/client/restApi/api/retrieveHistoricalData/readDealsByTimeRange/), [provider error and charges guidance](https://metaapi.cloud/docs/provisioning/excessiveErrors/).
