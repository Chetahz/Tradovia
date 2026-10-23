# MT5 connection decision (research, 27 Sep 2026)

## Product requirement

A customer enters their MT5 account number, exact broker server and **investor/read-only password** once in Tradovia. Historical closed trades are imported, subsequent closed trades appear without the customer keeping a PC or EA running, and the customer can disconnect and revoke access. Never promise every broker or a fixed delay before testing it.

## Findings

### Myfxbook comparison (verified against its help pages, 28 Sep 2026)

Myfxbook confirms that its MT5 **Auto Update** accepts read-only account credentials and continues updating on Myfxbook's servers with the user's terminal closed. It is free but **not real-time**: the article says updates occur every 2–4 hours depending on server load, while its summary table says once a day. The discrepancy makes the exact free refresh interval uncertain; neither wording supports an immediate-update promise. Its separate **Live Update** runs on its servers in real time and is paid. Myfxbook's Live Update help lists USD $60/year for **one account at a time**, with another subscription needed for each simultaneous account. A third method, EA Publisher, updates every five minutes only while the user's Windows MT5 is running.

This explains how a customer can enter an MT5 account number, broker server and investor password and see data without keeping a computer on, without implying that free and instant unlimited sync have the same economics. Myfxbook does not publish the internal design or cost of its terminal fleet, so do not claim its exact implementation. Its track-record verification uses the investor password; master password is relevant to the separate proof of trading privileges, not required for read-only history. Tradovia should request only investor credentials for journal import.

Do not use Myfxbook's personal-data API as an undocumented commercial data backend. Its published API says software built on it should be free and history is limited to the last 50 transactions. A paid Tradovia integration would require explicit suitable terms and a separate completeness check.

| Approach | Customer PC needed? | Ongoing sync | Economics and fit |
| --- | --- | --- | --- |
| Manual report/CSV import | No | No | Already available; keep as fallback. |
| Customer-side EA | Yes, unless customer runs a VPS | Fast while running | Low vendor cost but fails the required onboarding experience. |
| MetaApi cloud-g2 | No | Hosted account, poll or stream | Existing Tradovia implementation is feature-gated. Current account's Rates page: USD $0.0126/account-hour for high-reliability cloud-g2, USD $2.10/unique account addition, USD $0.0756/deployment, before VAT/GST. Public Regular plan advertises USD $30/month and one included MT account. Unsuitable as the default on a THB 199/month tier without a proven allowance or higher-priced add-on. |
| Other managed APIs | No | Provider-dependent | MetaKit advertises USD $5/read-only account-month with history and webhooks. DeckLive advertises flat-price Connector API but **does not publish its developer API price**; its white-label 200-account price and setup fee do not establish an integration price for Tradovia. Neither vendor has been validated with a Tradovia account or broker. Get written terms and run a demo before adoption. |
| Tradovia-hosted MT5 connector | No | Potentially near-real-time | Use a separately hosted Windows-compatible worker running MT5 terminal instances, investor logins and read-only history collection. Cost is shared across customers, but capacity, compatibility, security, uptime and operations are ours. This is the best candidate for a controlled proof of concept, not yet a sale-ready implementation. |
| Broker/Manager API | No | Broker-dependent | Direct MT5 Manager API access is for brokers or broker partners with manager rights, not a universal retail-customer integration. |

## Technical basis for the hosted connector

MetaQuotes documents `initialize`/`login` with account number, password and server, and `history_deals_get` by date range or position. MT5 supports an `OnTradeTransaction` EA handler for server-originated trade events. For a first proof of concept, fetch historical deals, normalize closed positions and check recent deals periodically with overlap plus idempotent import. Test an event-driven path separately; do not assume every event arrives exactly once or in order. Multiple simultaneously connected accounts require separate terminal installations/instances in different directories per MetaQuotes' guide. Cloudflare Workers cannot run the MT5 desktop executable; the connector must be a separate compute service.

### Prototype status

An offline demo-only history probe and conservative deal normalizer are in `experiments/mt5-connector/`. On 27 Sep 2026 the owner-provided Exness demo connected in investor mode, and the pilot read 16 historical deals and converted 7 closed positions over a 90-day window. Python's TradeDeal omitted SL/TP, so those fields now remain unknown rather than causing valid trades to be dropped. `lib/mt5-pilot-import.ts` validates and deduplicates the resulting journal trades. An owner-only, disabled-by-default connector-token and ingest path now exists in code; no remote upload, recurring sync, VPS deployment, customer credential vault, or multi-broker test has occurred. The probe intentionally omits unsupported deal patterns rather than treating the prototype as production-ready.

For the demo pilot, the official MetaTrader5 Python package is installed in the ignored local `.deps/` folder. The generic MT5 terminal was used for the successful read-only history test. The first attempts failed with an IPC timeout while the terminal had no broker connection; they succeeded after the terminal connected. No credential from chat was copied into any command or file.

## Pilot gates before collecting customer credentials or buying long-term hosting

1. Choose a short-duration, budget-capped host and confirm its OS/software licensing terms. Use only broker demo accounts for the pilot. Do not place a customer's MT5 password in chat, source, logs, or ordinary D1 payloads.
2. Build an isolated connector with a secret vault, encrypted per-account investor credentials, restricted service identity, no master-password onboarding, per-user ownership checks, and provider deletion/credential revocation on disconnect. The UI must accurately explain who processes the credentials.
3. Test at least two MT5 brokers and account states. Measure time to initial history, lag from a new closed mobile trade, partial close/netting handling, idempotency, disconnection, wrong password and broker-server errors.
4. Load-test 1, 5, 10 and more concurrent accounts; measure RAM/CPU, restart recovery and cost per active account. Derive account limits and pricing only from the observed capacity. Do not claim 100-customer capacity from a single-machine test.
5. Keep manual/report import available. Gate cloud MT5 sync until the pilot passes and its per-account economics fit the subscription.

## Unit-economics gate for a THB 199/month plan (28 Sep 2026)

Use an initial infrastructure budget of **no more than THB 40–60 per active synced MT5 account per month** at 100 paying customers (20–30% of gross subscription revenue). This is a planning target, not a measured cost or a promise of unlimited accounts. It excludes payment fees, taxes, support and development, so the final budget may need to be lower. The denominator is *active MT5 accounts*, not users: a customer with three accounts consumes three account slots.

Do not make MetaApi per-account hosting the default at THB 199. The existing account-specific rate of USD $0.0126/account-hour is about USD $9.07/account-month at 720 hours, before the base subscription, account-add charges and taxes. At 100 active accounts this exceeds the target even before other costs. Keep it as a possible higher-priced or short-term fallback, not an advertised unlimited entitlement.

The preferred experiment is one **short-duration Windows VPS** running Tradovia-managed, isolated MT5 terminals. MetaQuotes documents that simultaneous accounts need separate terminal installations in different directories; a single logged-in terminal cannot provide simultaneous monitoring of 100 different accounts. A provider's public example is a USD $37/month Windows Server VPS with 2 cores and 4 GB RAM, including Windows, but this is only a pilot-size price reference. It does **not** establish how many MT5 accounts will fit or what production redundancy will cost. Do not buy a long term or customer-sized server based on that figure.

Measure the pilot with 1, 5 and 10 concurrent *demo investor* logins across at least two brokers. Record memory, CPU, disk, reconnects, first history time, 95th-percentile closed-trade sync delay, missed/duplicate imports and restart recovery. Calculate `(VPS + Windows licence + backups + monitoring + estimated support) / safely supported active accounts` from the measured capacity, with headroom and a second-node failure plan. If the cost or latency misses the target, test fewer continuously connected accounts plus scheduled polling and label the actual sync delay honestly; do not market that tier as instant. A faster continuous-sync tier can be priced separately.

The customer experience target remains: enter account number, exact broker server and investor password in Tradovia once, then the hosted connector syncs without the customer's computer. That requires an encrypted credential vault, customer-owned connection lifecycle, automatic provisioning, quotas, error recovery and prompt deletion on disconnect before launch. The present local Exness demo probe and disabled ingest route prove only basic history reading and validation; they do not prove the customer flow, broad broker coverage or 100-account economics.

## Source references

- MetaQuotes Python login/initialize: https://www.mql5.com/en/docs/python_metatrader5/mt5initialize_py
- MetaQuotes history deals API: https://www.mql5.com/en/docs/python_metatrader5/mt5historydealsget_py
- MetaQuotes event handling: https://www.mql5.com/en/docs/event_handlers/ontradetransaction
- MetaQuotes multiple terminal installations: https://www.metatrader5.com/en/terminal/help/start_advanced/installation
- Pilot-size Windows VPS example: https://www.kamatera.com/cloud-vps/windows-vps-hosting/
- MetaApi pricing: https://metaapi.cloud/#pricing
- Myfxbook MT5 methods: https://www.myfxbook.com/help/knowledge-base/metatrader-5-connection-methods/
- Myfxbook Live Update pricing: https://www.myfxbook.com/help/knowledge-base/live-update/
- Myfxbook account verification: https://www.myfxbook.com/help/knowledge-base/verification/
- Myfxbook API terms and history scope: https://www.myfxbook.com/api
- MetaKit vendor pricing (unverified in Tradovia): https://metakit.cloud/
- DeckLive Connector vendor terms (developer price unpublished): https://decklive.io/connector
- Manager API eligibility: https://metaapi.cloud/docs/manager/faq/
