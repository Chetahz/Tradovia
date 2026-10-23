"""One-shot read-only MT5 pilot sync. Disabled unless --send is explicit."""

import argparse
from datetime import datetime, timedelta, timezone
import json
import os
from pathlib import Path
import sys
from urllib.error import HTTPError
from urllib.request import HTTPRedirectHandler, Request, build_opener

from normalize import normalize_deals
from probe import FIELDS

INGEST_URL = "https://tradovia-app.rachatakaewthong.workers.dev/api/mt5/bridge/ingest"


class NoRedirects(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        raise RuntimeError("MT5 bridge refused a redirect")


def collect(mt5, terminal, account, server, days):
    if not mt5.initialize(str(terminal), timeout=30000):
        raise RuntimeError(f"MT5 terminal unavailable (code {mt5.last_error()[0]})")
    try:
        terminal_info = mt5.terminal_info()
        info = mt5.account_info()
        if not terminal_info or not terminal_info.connected or not info or \
                info.login != account or info.server != server or \
                info.trade_mode != mt5.ACCOUNT_TRADE_MODE_DEMO or info.trade_allowed is not False:
            raise RuntimeError("Expected read-only demo account is not connected")
        end = datetime.now(timezone.utc)
        deals = mt5.history_deals_get(end - timedelta(days=days), end)
        if deals is None:
            raise RuntimeError(f"MT5 history unavailable (code {mt5.last_error()[0]})")
        positions, skipped = normalize_deals([
            {key: getattr(deal, key, None) for key in FIELDS} for deal in deals
        ])
        return positions, skipped, len(deals)
    finally:
        mt5.shutdown()


def upload(positions, account, server, token):
    opener = build_opener(NoRedirects)
    batches = [positions[i:i + 100] for i in range(0, len(positions), 100)] or [[]]
    imported = duplicate = 0
    for batch in batches:
        body = json.dumps({"login": str(account), "server": server, "positions": batch}).encode("utf-8")
        request = Request(INGEST_URL, data=body, method="POST", headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        })
        try:
            with opener.open(request, timeout=30) as response:
                result = json.load(response)
        except HTTPError as error:
            raise RuntimeError(f"MT5 bridge rejected batch (HTTP {error.code})") from None
        imported += result["imported"]
        duplicate += result["duplicate"]
    return imported, duplicate


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--terminal", type=Path, required=True)
    parser.add_argument("--account", type=int, required=True)
    parser.add_argument("--server", required=True)
    parser.add_argument("--days", type=int, default=90)
    parser.add_argument("--send", action="store_true", help="Upload only after a pilot token is configured")
    args = parser.parse_args()
    if not args.terminal.is_file() or args.account <= 0 or not 1 <= args.days <= 365:
        parser.error("Provide an MT5 terminal, positive account, and 1-365 days")
    sys.path.insert(0, str(Path(__file__).resolve().parent / ".deps"))
    import MetaTrader5 as mt5

    positions, skipped, count = collect(mt5, args.terminal, args.account, args.server, args.days)
    print(json.dumps({"deals": count, "closedPositions": len(positions), "skipped": skipped}))
    if not args.send:
        print("Dry run only; no data uploaded")
        return
    token = os.environ.get("TRADOVIA_MT5_BRIDGE_TOKEN", "")
    if not token.startswith("tdv_mt5_") or len(token) != 51:
        raise SystemExit("Pilot bridge token is not configured in the process environment")
    imported, duplicate = upload(positions, args.account, args.server, token)
    print(json.dumps({"imported": imported, "duplicate": duplicate}))


if __name__ == "__main__":
    main()
