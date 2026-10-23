"""Read-only local terminal health check; never accepts or prints credentials."""

import argparse
from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys

from normalize import normalize_deals
from probe import FIELDS


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--history-days", type=int)
    parser.add_argument("--expected-account", type=int)
    parser.add_argument("--expected-server")
    args = parser.parse_args()
    if args.history_days is not None and not 1 <= args.history_days <= 365:
        parser.error("--history-days must be between 1 and 365")
    if args.history_days is not None and (not args.expected_account or not args.expected_server):
        parser.error("History check requires expected account and server")
    sys.path.insert(0, str(Path(__file__).resolve().parent / ".deps"))
    import MetaTrader5 as mt5

    terminal = r"C:\Program Files\MetaTrader 5\terminal64.exe"
    initialized = mt5.initialize(terminal, timeout=10000)
    print("initialized:", initialized)
    print("last_error_code:", mt5.last_error()[0])
    if initialized:
        try:
            inspect_connected_terminal(mt5, args)
        finally:
            mt5.shutdown()


def inspect_connected_terminal(mt5, args):
    terminal_info = mt5.terminal_info()
    account_info = mt5.account_info()
    print("terminal_connected:", bool(terminal_info and terminal_info.connected))
    print("account_present:", account_info is not None)
    print("account_demo:", bool(account_info and account_info.trade_mode == mt5.ACCOUNT_TRADE_MODE_DEMO))
    print("account_read_only:", bool(account_info and account_info.trade_allowed is False))
    if args.history_days is None:
        return
    if not (terminal_info and terminal_info.connected and account_info
            and account_info.trade_mode == mt5.ACCOUNT_TRADE_MODE_DEMO
            and account_info.trade_allowed is False
            and account_info.login == args.expected_account
            and account_info.server == args.expected_server):
        raise SystemExit("History check refused: expected read-only demo account is not connected")
    end = datetime.now(timezone.utc)
    deals = mt5.history_deals_get(end - timedelta(days=args.history_days), end)
    if deals is None:
        raise SystemExit(f"History read failed (code {mt5.last_error()[0]})")
    first_trade = next((deal for deal in deals if deal.type in (0, 1)), None)
    if first_trade is not None:
        print("deal_object_type:", type(first_trade).__name__)
        print("missing_fields:", tuple(key for key in FIELDS if getattr(first_trade, key, None) is None))
    positions, skipped = normalize_deals([
        {key: getattr(deal, key, None) for key in FIELDS} for deal in deals
    ])
    print("history_days:", args.history_days)
    print("deal_count:", len(deals))
    print("closed_position_count:", len(positions))
    print("skipped_counts:", skipped)


if __name__ == "__main__":
    main()
