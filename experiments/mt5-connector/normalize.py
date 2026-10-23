"""Conservative MT5 deal-to-position normalization for the connector pilot.

No MetaTrader dependency: this module can be tested with synthetic deals.
The output matches lib/mt5-sync.ts:Mt5Position. Times are UTC until a broker
timezone has been verified against a real MT5 statement.
"""

from collections import defaultdict
from datetime import datetime, timezone
from math import isclose, isfinite


REQUIRED = (
    "ticket", "position_id", "time", "type", "entry", "symbol", "volume",
    "price", "profit", "commission", "swap",
)


def _stamp(epoch):
    return datetime.fromtimestamp(epoch, timezone.utc).strftime("%Y.%m.%d %H:%M:%S")


def _optional_price(value):
    return value if isinstance(value, (int, float)) and isfinite(value) and value > 0 else 0


def _valid_deal(deal):
    if not isinstance(deal, dict) or any(key not in deal for key in REQUIRED):
        return False
    if not isinstance(deal["ticket"], int) or deal["ticket"] <= 0:
        return False
    if not isinstance(deal["position_id"], int) or deal["position_id"] <= 0:
        return False
    if not isinstance(deal["time"], int) or deal["time"] <= 0:
        return False
    if deal["type"] not in (0, 1) or deal["entry"] not in (0, 1, 2, 3):
        return False
    if not isinstance(deal["symbol"], str) or not deal["symbol"]:
        return False
    return all(
        isinstance(deal[key], (int, float)) and isfinite(deal[key])
        for key in ("volume", "price", "profit", "commission", "swap")
    ) and deal["volume"] > 0 and deal["price"] > 0


def normalize_deals(deals):
    """Return (closed_positions, skipped_reasons).

    Only ordinary BUY/SELL IN and OUT deals are supported. A position whose
    complete deal history is unavailable, or which contains a reversal or
    close-by, is skipped rather than guessed. Input may contain balance deals;
    those are ignored. Duplicate tickets are rejected for that position.
    """
    grouped = defaultdict(list)
    skipped = defaultdict(int)
    for deal in deals:
        if not isinstance(deal, dict):
            skipped["invalid_deal"] += 1
            continue
        if deal.get("type") not in (0, 1):
            continue
        if not _valid_deal(deal):
            skipped["invalid_deal"] += 1
            continue
        grouped[deal["position_id"]].append(deal)

    positions = []
    for position_id, parts in grouped.items():
        parts.sort(key=lambda d: (d["time"], d["ticket"]))
        incoming = [d for d in parts if d["entry"] == 0]
        outgoing = [d for d in parts if d["entry"] == 1]
        reason = None
        if len({d["ticket"] for d in parts}) != len(parts):
            reason = "duplicate_ticket"
        elif len(incoming) + len(outgoing) != len(parts):
            reason = "complex_position"
        elif not incoming or not outgoing:
            reason = "open_or_incomplete"
        elif parts[0]["entry"] != 0 or parts[-1]["entry"] != 1:
            reason = "inconsistent_order"
        elif max(d["time"] for d in incoming) > min(d["time"] for d in outgoing):
            reason = "complex_position"
        elif len({d["symbol"] for d in parts}) != 1 or len({d["type"] for d in incoming}) != 1:
            reason = "inconsistent_symbol_or_side"
        elif any(d["type"] == incoming[0]["type"] for d in outgoing):
            reason = "inconsistent_side"
        else:
            in_volume = sum(d["volume"] for d in incoming)
            out_volume = sum(d["volume"] for d in outgoing)
            if not isclose(in_volume, out_volume, abs_tol=1e-7, rel_tol=1e-7):
                reason = "open_or_incomplete"

        if reason:
            skipped[reason] += 1
            continue

        in_volume = sum(d["volume"] for d in incoming)
        out_volume = sum(d["volume"] for d in outgoing)
        positions.append({
            "positionId": str(position_id),
            "symbol": incoming[0]["symbol"],
            "side": "LONG" if incoming[0]["type"] == 0 else "SHORT",
            "openTime": _stamp(incoming[0]["time"]),
            "closeTime": _stamp(outgoing[-1]["time"]),
            "entry": sum(d["price"] * d["volume"] for d in incoming) / in_volume,
            "closePrice": sum(d["price"] * d["volume"] for d in outgoing) / out_volume,
            "volume": in_volume,
            "profit": sum(d["profit"] for d in parts),
            "commission": sum(d["commission"] for d in parts),
            "swap": sum(d["swap"] for d in parts),
            # The Python TradeDeal object may omit SL/TP entirely. Zero means
            # unknown here; never infer a planned stop or target from P&L.
            "reportedSl": _optional_price(incoming[0].get("sl")),
            "reportedTp": _optional_price(incoming[0].get("tp")),
        })

    positions.sort(key=lambda p: (p["closeTime"], p["positionId"]))
    return positions, dict(skipped)
