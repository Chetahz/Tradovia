import unittest
from types import SimpleNamespace

from normalize import normalize_deals
from probe import fetch_demo_history


def deal(ticket, position_id, time, type, entry, volume, price, profit=0, commission=0, swap=0):
    return dict(ticket=ticket, position_id=position_id, time=time, type=type, entry=entry,
                symbol="XAUUSD.pro", volume=volume, price=price, profit=profit,
                commission=commission, swap=swap, sl=2490, tp=2530)


class NormalizeTests(unittest.TestCase):
    def test_python_trade_deal_without_sl_tp_is_importable(self):
        incoming = deal(1, 100, 1700000000, 0, 0, .1, 2500)
        outgoing = deal(2, 100, 1700000100, 1, 1, .1, 2510, profit=100)
        for part in (incoming, outgoing):
            part.pop("sl")
            part.pop("tp")
        positions, skipped = normalize_deals([incoming, outgoing])
        self.assertEqual(skipped, {})
        self.assertEqual(len(positions), 1)
        self.assertEqual(positions[0]["reportedSl"], 0)
        self.assertEqual(positions[0]["reportedTp"], 0)

    def test_partial_close_aggregates_fees_and_weighted_prices(self):
        positions, skipped = normalize_deals([
            deal(1, 100, 1700000000, 0, 0, .02, 2500, commission=-.2),
            deal(2, 100, 1700000100, 0, 0, .01, 2510, commission=-.1),
            deal(3, 100, 1700000200, 1, 1, .01, 2520, profit=20, commission=-.1),
            deal(4, 100, 1700000300, 1, 1, .02, 2530, profit=40, commission=-.2, swap=-.3),
        ])
        self.assertEqual(skipped, {})
        self.assertEqual(len(positions), 1)
        self.assertEqual(positions[0]["positionId"], "100")
        self.assertAlmostEqual(positions[0]["entry"], 2503.3333333333335)
        self.assertAlmostEqual(positions[0]["closePrice"], 2526.6666666666665)
        self.assertAlmostEqual(positions[0]["commission"], -.6)
        self.assertAlmostEqual(positions[0]["swap"], -.3)

    def test_open_reversal_duplicate_and_inconsistent_deals_are_skipped(self):
        positions, skipped = normalize_deals([
            deal(1, 1, 1700000000, 0, 0, .1, 2500),
            deal(2, 2, 1700000000, 0, 0, .1, 2500),
            deal(3, 2, 1700000100, 1, 2, .2, 2490),
            deal(4, 3, 1700000000, 0, 0, .1, 2500),
            deal(4, 3, 1700000100, 1, 1, .1, 2490),
            deal(5, 4, 1700000000, 0, 0, .1, 2500),
            deal(6, 4, 1700000100, 0, 1, .1, 2490),
        ])
        self.assertEqual(positions, [])
        self.assertEqual(skipped, {"open_or_incomplete": 1, "complex_position": 1,
                                   "duplicate_ticket": 1, "inconsistent_side": 1})

    def test_read_only_demo_gate_happens_before_history_query(self):
        class FakeMt5:
            ACCOUNT_TRADE_MODE_DEMO = 0
            def __init__(self, info):
                self.info = info
                self.history_called = False
                self.shutdown_called = False
                self.initialize_options = None
            def initialize(self, *args, **kwargs):
                self.initialize_options = kwargs
                return True
            def account_info(self):
                return self.info
            def history_deals_get(self, *args):
                self.history_called = True
                return []
            def shutdown(self):
                self.shutdown_called = True

        for mode, allowed in ((2, False), (0, True)):
            fake = FakeMt5(SimpleNamespace(login=123, server="Demo", trade_mode=mode,
                                           trade_allowed=allowed))
            with self.assertRaises(RuntimeError):
                fetch_demo_history(fake, "terminal.exe", 123, "Demo", "hidden", 1)
            self.assertFalse(fake.history_called)
            self.assertTrue(fake.shutdown_called)

        fake = FakeMt5(SimpleNamespace(login=123, server="Demo", trade_mode=0,
                                       trade_allowed=False))
        result, deal_count = fetch_demo_history(fake, "terminal.exe", 123, "Demo", "hidden", 1)
        self.assertEqual(result, ([], {}))
        self.assertEqual(deal_count, 0)
        self.assertTrue(fake.history_called)
        self.assertIs(fake.initialize_options["portable"], False)


if __name__ == "__main__":
    unittest.main()
