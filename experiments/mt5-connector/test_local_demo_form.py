import re
import threading
import unittest
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from unittest.mock import patch
from http.server import HTTPServer

from local_demo_form import make_handler, page


class LocalDemoFormTests(unittest.TestCase):
    def test_loopback_form_requires_csrf_and_never_echoes_password(self):
        self.assertIn('value="{TOKEN}"', page())
        fake_mt5 = object()
        server = HTTPServer(("127.0.0.1", 0), make_handler(fake_mt5, "terminal.exe", 123, "Demo"))
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        origin = f"http://127.0.0.1:{server.server_port}"
        try:
            with urlopen(origin + "/") as response:
                html = response.read().decode()
                self.assertEqual(response.headers["Cache-Control"], "no-store")
            csrf = re.search(r'name="csrf" value="([^"]+)"', html).group(1)
            body = urlencode({"csrf": csrf, "password": "fake-secret-value"}).encode()
            bad = Request(origin + "/probe", data=urlencode({"csrf": "wrong", "password": "fake-secret-value"}).encode(), headers={
                "Content-Type": "application/x-www-form-urlencoded",
            })
            with self.assertRaises(HTTPError) as error:
                urlopen(bad)
            self.assertEqual(error.exception.code, 403)
            good = Request(origin + "/probe", data=body, headers={
                "Content-Type": "application/x-www-form-urlencoded", "Origin": origin,
            })
            with patch("local_demo_form.fetch_demo_history", return_value=(([], {}), 0)) as fetch:
                with urlopen(good) as response:
                    result = response.read().decode()
                    self.assertEqual(response.status, 200)
                fetch.assert_called_once_with(fake_mt5, "terminal.exe", 123, "Demo",
                                              "fake-secret-value", 30, portable=False)
            self.assertNotIn("fake-secret-value", result)
            self.assertIn("เชื่อมต่อได้", result)
            no_origin = Request(origin + "/probe", data=body, headers={
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            })
            with patch("local_demo_form.fetch_demo_history", return_value=(([], {}), 0)):
                with urlopen(no_origin) as response:
                    self.assertEqual(response.status, 200)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)


if __name__ == "__main__":
    unittest.main()
