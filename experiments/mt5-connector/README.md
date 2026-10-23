# MT5 read-only connector pilot

This is an **owner-only demo pilot**, not the customer connection service. It
uses the official MetaTrader5 Python integration to read history from one
isolated Windows MT5 terminal. It never calls trading APIs. Upload is disabled
by default and requires the explicit `--send` flag plus a provisioned bridge
token and enabled server feature flag.

## What can be tested now

`normalize.py` converts ordinary closed IN/OUT deals into the existing
`Mt5Position` shape. Partial exits are summed. Open or incomplete positions,
reversals, close-by, duplicate tickets and inconsistent histories are skipped
and counted rather than imported incorrectly. Tests require only Python's
standard library:

```powershell
python -m unittest discover -s experiments/mt5-connector -p 'test_*.py'
```

`lib/mt5-pilot-import.ts` validates these positions against the existing
Tradovia trade schema, maps them to journal trades and detects repeats. The
disabled-by-default `/api/mt5/bridge/ingest` route can accept an authorized
pilot upload after the D1 migration and feature flag are applied. No data has
been sent to that route or imported into the live journal yet.

## Later isolated-host demo trial

Use a dedicated Windows pilot host and a **separate MT5 terminal installation**.
Install Windows Python and the official `MetaTrader5` package there, and use
only a broker **demo investor/read-only password**. The script refuses real
accounts and logins for which trading is allowed. Enter the investor password
only at its hidden interactive prompt, never in a command line, file, chat,
or source code. The MT5 terminal itself may retain a credential in its local
profile; therefore do not run the trial on a personal/customer terminal.

For the development pilot, the official `metatrader5` Python package can be
installed in this folder's ignored `.deps/` directory. The probe loads it from
there automatically; no project or system-wide Python installation is changed.
The package is installed locally. On 2026-09-27, the first login attempts
timed out while MT5 was offline. After the terminal connected, the local
read-only pilot verified the expected Exness demo account and read 16 deals
over 90 days, converting them into 7 closed positions. Only counts were
printed; no credential or trade detail was saved or uploaded.

For the multi-broker pilot, use a dedicated clean MetaTrader 5 installation
directory. The standard MT5 terminal lets the operator find and choose a
broker server. Never point the probe at a personal trading terminal.
At the credential prompt, the account owner types the read-only password
directly; the operator and chat do not need to know it. The demo account number
and exact server name can be passed as non-secret command arguments.

On the development PC, `start-visible-demo.ps1` opens an unmistakable
`TRADOVIA MT5 DEMO READ-ONLY TEST` console window with the hidden prompt. A
normal `PS ...>` prompt is **not** the password prompt. The optional `--summary`
file records only deal/position counts and skip reasons, never credentials.

If a console prompt is confusing, `local_demo_form.py` provides a simpler
password form bound **only to `127.0.0.1`**. It does not persist the password,
send trading orders, or expose a production API. The browser is instructed not
to cache the page; the form has a CSRF token and at most three attempts.
The form prints only aggregate deal/position counts to the local process.
It now checks local terminal IPC before opening the credential form, to avoid
asking for a password when Python cannot communicate with MT5 at all.

When the terminal was offline, `last_error` was **-10005 (IPC timeout)** even
without credentials. It cleared after the terminal's internet connection
recovered. A cached read-only login is enough for `diagnose_terminal.py` to
query history without prompting for the password. The Python `TradeDeal`
objects on this installation omit SL/TP; the normalizer treats those values as
unknown rather than discarding otherwise valid closed positions.

The local history check is:

```powershell
python experiments/mt5-connector/diagnose_terminal.py --history-days 90 --expected-account 123456 --expected-server Broker-Demo
```

`sync_once.py` reads the same isolated terminal and defaults to a dry run. It
refuses any account other than the expected connected demo/investor login.
`--send` is available only after the owner's pilot connection has been created
on Tradovia, a one-time connection token has been installed as
`TRADOVIA_MT5_BRIDGE_TOKEN` in the connector host's secret environment, and
`MT5_BRIDGE_PILOT_ENABLED=true` has been deliberately enabled on the app.
The token is never the broker password. The connector sends normalized closed
positions over HTTPS to the connection-scoped ingest route in batches of 100.
The route validates account identity, ownership, payloads and duplicates, and
stores only closed trades. Disconnecting deletes the token hash. This is still
an owner-only demo pilot; no customer credential collection or automatic VPS
deployment exists yet.

The one-time token is returned to the signed-in pilot owner when the connection
is created. Transfer it directly to the isolated connector host's secret
environment; do not keep it in browser storage, source code, chat, or ordinary
logs. The live pilot should remain disabled until the broker timezone and
imported trade figures have been checked against an MT5 statement.

```powershell
python experiments/mt5-connector/probe.py --terminal 'C:\isolated-mt5\terminal64.exe' --account 123456 --server 'Broker-Demo' --days 30
```

The normal Windows installation uses MT5's separate data directory for each
installation path. Use `--portable` only when the isolated terminal folder is
writable and portable mode is intended. Do not use portable mode for a normal
`Program Files` installation.

By default only counts and skip reasons are printed. An explicit `--output`
path can save normalized trade data locally for comparison with the MT5
statement. The file contains sensitive trading history; keep it outside the
repository and delete it after review. No live broker has been tested yet.

## Before a customer launch

- Verify broker server discovery, account login, broker timezone and history
  against actual demo statements from multiple brokers.
- Add encrypted credential storage, a queue/scheduler, per-account isolation,
  retry/backoff, health checks, and immediate disconnect/revocation.
- Measure historical import and fresh-close latency, throughput and VPS cost
  for the planned account count. Near-real-time is a target, not a guarantee.
- Decide how to represent netting reversals, close-by and broker-specific
  commission deals before those records enter the journal.

Official docs: [initialize](https://www.mql5.com/en/docs/python_metatrader5/mt5initialize_py),
[history_deals_get](https://www.mql5.com/en/docs/python_metatrader5/mt5historydealsget_py),
[deal properties](https://www.mql5.com/en/docs/constants/tradingconstants/dealproperties).
