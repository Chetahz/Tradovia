"""Loopback-only demo probe form. Never use as a customer or production API."""

from html import escape
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs
import argparse
import json
import secrets
import sys

from probe import fetch_demo_history


def page(message="", success=False):
    result = f'<p class="result {"ok" if success else "error"}">{escape(message)}</p>' if message else ""
    return f"""<!doctype html><html lang="th"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tradovia MT5 Demo Test</title><style>
*{{box-sizing:border-box}}body{{margin:0;min-height:100vh;display:grid;place-items:center;
font:16px system-ui,sans-serif;background:#0d1918;color:#f2fffc;padding:24px}}
main{{width:min(100%,440px);padding:30px;border:1px solid #31524c;border-radius:24px;
background:#142723;box-shadow:0 24px 80px #0008}}.brand{{color:#18e6c5;font-weight:800;
letter-spacing:.02em}}h1{{font-size:25px;line-height:1.3;margin:24px 0 8px}}p{{line-height:1.6;
color:#b9d0ca}}label{{display:block;margin:24px 0 8px;font-weight:650}}
input{{width:100%;padding:15px 16px;border-radius:12px;border:1px solid #54726b;
background:#0d1918;color:white;font-size:18px}}input:focus{{outline:2px solid #18e6c5}}
button{{width:100%;margin-top:18px;border:0;border-radius:12px;padding:16px;
background:#18e6c5;color:#06221d;font-size:16px;font-weight:750;cursor:pointer}}
.note{{font-size:13px}}.result{{padding:14px;border-radius:12px;margin-top:20px}}
.ok{{background:#0f463d;color:#d8fff2}}.error{{background:#492b26;color:#ffe1d9}}
</style></head><body><main><div class="brand">T tradovia · LOCAL PILOT</div>
<h1>ทดสอบ MT5 เดโม่แบบอ่านอย่างเดียว</h1>
<p>หน้านี้ทำงานบนคอมเครื่องนี้เท่านั้น ใช้รหัส Investor ของบัญชีเดโม่
เพื่ออ่านจำนวนรายการในประวัติ ไม่มีการส่งคำสั่งเทรดหรือบันทึกรหัส</p>
<form method="post" action="/probe" autocomplete="off">
<input type="hidden" name="csrf" value="{{TOKEN}}">
<label for="password">รหัส Investor (Read-only)</label>
<input id="password" name="password" type="password" required minlength="1"
maxlength="256" autocomplete="off" spellcheck="false" autofocus>
<button type="submit">ตรวจการเชื่อมต่อเดโม่</button></form>
{result}<p class="note">กรอกรหัสในช่องนี้เท่านั้น ไม่ต้องส่งในแชตหรือ PowerShell</p>
</main></body></html>"""


def make_handler(mt5, terminal, account, server):
    csrf = secrets.token_urlsafe(32)
    state = {"attempts": 0}

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass  # Never log a path, request body, account, or credential.

        def respond(self, status, body):
            payload = body.replace("{TOKEN}", csrf).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'")
            self.end_headers()
            self.wfile.write(payload)

        def do_GET(self):
            if self.path != "/" or self.headers.get("Host") != f"127.0.0.1:{self.server.server_port}":
                self.send_error(404)
                return
            self.respond(200, page())

        def do_POST(self):
            content_type = self.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
            if (self.path != "/probe" or self.headers.get("Host") != f"127.0.0.1:{self.server.server_port}"
                    or content_type != "application/x-www-form-urlencoded"):
                print("Rejected request headers", {
                    "path_ok": self.path == "/probe",
                    "host_ok": self.headers.get("Host") == f"127.0.0.1:{self.server.server_port}",
                    "content_type_ok": content_type == "application/x-www-form-urlencoded",
                }, flush=True)
                self.send_error(403)
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                self.send_error(400)
                return
            if length < 1 or length > 4096:
                self.send_error(413)
                return
            fields = parse_qs(self.rfile.read(length).decode("utf-8"), keep_blank_values=True)
            if fields.get("csrf") != [csrf]:
                print("Rejected request token", flush=True)
                self.send_error(403)
                return
            password_fields = fields.get("password", [])
            if len(password_fields) != 1 or not 1 <= len(password_fields[0]) <= 256:
                self.respond(400, page("กรุณากรอกรหัส Investor ในช่องด้านบน"))
                return
            if state["attempts"] >= 3:
                self.respond(429, page("ทดสอบครบ 3 ครั้งแล้ว กรุณาตรวจข้อมูลบัญชีก่อนลองใหม่"))
                return
            state["attempts"] += 1
            password = password_fields[0]
            try:
                (positions, skipped), deal_count = fetch_demo_history(
                    mt5, terminal, account, server, password, 30, portable=False,
                )
                print(json.dumps({"dealCount": deal_count, "closedPositions": len(positions),
                                  "skipped": skipped}), flush=True)
                self.respond(200, page(
                    f"เชื่อมต่อได้: อ่าน {deal_count} ดีล พบ {len(positions)} รายการปิดที่แปลงได้", True,
                ))
            except RuntimeError as error:
                if "IPC timeout" in str(error):
                    message = "โปรแกรม MT5 บนคอมไม่ตอบสนองก่อนตรวจรหัส กรุณาตรวจตัวโปรแกรม MT5 ก่อน ไม่ต้องกรอกรหัสซ้ำ"
                else:
                    message = "เชื่อมต่อไม่สำเร็จ โปรดตรวจบัญชีเดโม่ เซิร์ฟเวอร์ และรหัส Investor"
                self.respond(400, page(message))
            finally:
                password = None

    return Handler


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--terminal", type=Path, required=True)
    parser.add_argument("--account", type=int, required=True)
    parser.add_argument("--server", required=True)
    args = parser.parse_args()
    if not args.terminal.is_file() or args.account <= 0 or not args.server:
        parser.error("Provide an isolated MT5 terminal, demo account, and broker server")
    sys.path.insert(0, str(Path(__file__).resolve().parent / ".deps"))
    import MetaTrader5 as mt5

    # Do not ask the user for a credential if local Python-to-terminal IPC is broken.
    if not mt5.initialize(str(args.terminal), timeout=10000):
        code = mt5.last_error()[0]
        raise SystemExit(f"MT5 terminal preflight failed (code {code}); no password was requested")
    mt5.shutdown()

    httpd = HTTPServer(("127.0.0.1", 0), make_handler(
        mt5, str(args.terminal), args.account, args.server,
    ))
    print(f"http://127.0.0.1:{httpd.server_port}/", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
