"""One-shot, local-only MT5 demo account history probe. No trading API calls."""

import argparse
from datetime import datetime, timedelta, timezone
from getpass import getpass
import json
from pathlib import Path
import sys

from normalize import normalize_deals


FIELDS = (
    "ticket", "position_id", "time", "type", "entry", "symbol", "volume",
    "price", "profit", "commission", "swap", "sl", "tp",
)


def fetch_demo_history(mt5, terminal, account, server, investor_password, days, portable=False):
    """Connect only to an isolated demo terminal and return normalized positions.

    The caller owns credential handling. Never echo passwords or account details.
    The terminal may retain account credentials, so this must run only on an
    isolated pilot machine and terminal profile, never on a customer's PC.
    """
    if not mt5.initialize(
        terminal, login=account, password=investor_password, server=server,
        timeout=30000, portable=portable,
    ):
        if mt5.last_error()[0] == -10005:
            raise RuntimeError("MT5 terminal IPC timeout before account validation")
        raise RuntimeError("MT5 connection failed; check the terminal and demo credentials")
    try:
        info = mt5.account_info()
        if info is None or info.login != account or info.server != server:
            raise RuntimeError("MT5 connected to a different account or server")
        if info.trade_mode != mt5.ACCOUNT_TRADE_MODE_DEMO:
            raise RuntimeError("Pilot accepts demo accounts only")
        if info.trade_allowed is not False:
            raise RuntimeError("Trading permission is enabled; use an investor/read-only login")

        end = datetime.now(timezone.utc)
        start = end - timedelta(days=days)
        deals = mt5.history_deals_get(start, end)
        if deals is None:
            raise RuntimeError("MT5 history read failed")
        raw = [{key: getattr(deal, key, None) for key in FIELDS} for deal in deals]
        return normalize_deals(raw), len(raw)
    finally:
        mt5.shutdown()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--terminal", type=Path, required=True, help="Isolated MT5 terminal64.exe path")
    parser.add_argument("--account", type=int, required=True, help="Demo account number")
    parser.add_argument("--server", required=True, help="Broker server name")
    parser.add_argument("--days", type=int, default=30, help="History window (1-90 days)")
    parser.add_argument("--portable", action="store_true", help="Use only with a writable isolated terminal folder")
    parser.add_argument("--output", type=Path, help="Optional local JSON result file; never commit it")
    parser.add_argument("--summary", type=Path, help="Optional local counts-only result file")
    args = parser.parse_args()
    if args.days < 1 or args.days > 90 or args.account <= 0 or not args.terminal.is_file():
        parser.error("Provide an existing isolated terminal, positive account, and 1-90 days")
    # A pilot install can keep the official package local to this folder.
    sys.path.insert(0, str(Path(__file__).resolve().parent / ".deps"))
    try:
        import MetaTrader5 as mt5
    except ImportError as error:
        raise SystemExit("Install the official MetaTrader5 Python package in isolated Windows Python") from error

    password = getpass("Demo investor password (hidden): ")
    if not password:
        raise SystemExit("Investor password is required")
    try:
        (positions, skipped), deal_count = fetch_demo_history(
            mt5, str(args.terminal), args.account, args.server, password, args.days,
            portable=args.portable,
        )
    except RuntimeError as error:
        raise SystemExit(str(error)) from None
    finally:
        password = None

    print(f"Read {deal_count} deals; {len(positions)} closed positions; skipped: {skipped}")
    if args.summary:
        args.summary.write_text(json.dumps({
            "dealCount": deal_count,
            "closedPositions": len(positions),
            "skipped": skipped,
        }), encoding="utf-8")
    if args.output:
        if args.output.exists():
            raise SystemExit("Output already exists; choose a new filename")
        args.output.write_text(json.dumps(positions, ensure_ascii=False, indent=2), encoding="utf-8")
        print("Wrote local pilot results. Do not commit or share this file.")


if __name__ == "__main__":
    main()
