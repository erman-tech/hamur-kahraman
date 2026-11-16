"""Hamur Kahraman için küçük yerel sunucu.
Videoların her tarayıcıda (Safari dahil) oynaması için parça parça okuma (Range) isteğini destekler.
Kullanım: python3 sunucu.py [port]"""
import os
import re
import sys
import http.server

KOK = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5095


class Isleyici(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=KOK, **k)

    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def do_GET(self):
        aralik = self.headers.get("Range")
        yol = self.translate_path(self.path)
        m = re.match(r"bytes=(\d*)-(\d*)$", aralik or "")
        if not m or not os.path.isfile(yol):
            return super().do_GET()
        boyut = os.path.getsize(yol)
        if m.group(1) == "":            # son N bayt
            bas, son = max(0, boyut - int(m.group(2) or 0)), boyut - 1
        else:
            bas, son = int(m.group(1)), int(m.group(2)) if m.group(2) else boyut - 1
        son = min(son, boyut - 1)
        if bas > son:
            self.send_response(416)
            self.send_header("Content-Range", "bytes */%d" % boyut)
            self.end_headers()
            return
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(yol))
        self.send_header("Content-Range", "bytes %d-%d/%d" % (bas, son, boyut))
        self.send_header("Content-Length", str(son - bas + 1))
        self.end_headers()
        with open(yol, "rb") as f:
            f.seek(bas)
            kalan = son - bas + 1
            try:
                while kalan > 0:
                    parca = f.read(min(65536, kalan))
                    if not parca:
                        break
                    self.wfile.write(parca)
                    kalan -= len(parca)
            except (BrokenPipeError, ConnectionResetError):
                pass


if __name__ == "__main__":
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Isleyici).serve_forever()
