import unittest
from types import SimpleNamespace

from sync_once import collect


class FakeMt5:
    ACCOUNT_TRADE_MODE_DEMO = 0

    def __init__(self, allowed):
        self.allowed = allowed
        self.history_called = False
        self.shutdown_called = False

    def initialize(self, *args, **kwargs):
        return True

    def terminal_info(self):
        return SimpleNamespace(connected=True)

    def account_info(self):
        return SimpleNamespace(login=123, server='Broker-Demo', trade_mode=0,
                               trade_allowed=self.allowed)

    def history_deals_get(self, *args):
        self.history_called = True
        return []

    def shutdown(self):
        self.shutdown_called = True


class SyncOnceTests(unittest.TestCase):
    def test_refuses_tradable_account_before_history_access(self):
        mt5 = FakeMt5(True)
        with self.assertRaises(RuntimeError):
            collect(mt5, 'terminal.exe', 123, 'Broker-Demo', 1)
        self.assertFalse(mt5.history_called)
        self.assertTrue(mt5.shutdown_called)

    def test_read_only_account_can_be_collected_without_a_password(self):
        mt5 = FakeMt5(False)
        positions, skipped, deal_count = collect(mt5, 'terminal.exe', 123, 'Broker-Demo', 1)
        self.assertEqual((positions, skipped, deal_count), ([], {}, 0))
        self.assertTrue(mt5.history_called)
        self.assertTrue(mt5.shutdown_called)


if __name__ == '__main__':
    unittest.main()
