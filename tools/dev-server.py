"""Servidor local con URLs limpias, igual que nginx.conf / .htaccess.

    /              -> index.html
    /nosotros      -> nosotros.html
    /index.html    -> 301 a /
    /nosotros.html -> 301 a /nosotros

Uso (desde la carpeta del proyecto):  python tools/dev-server.py [puerto]
"""
import http.server
import os
import sys
from urllib.parse import urlsplit

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class CleanURLHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        url = urlsplit(self.path)
        path = url.path
        query = f"?{url.query}" if url.query else ""

        # Enlaces antiguos con .html -> URL limpia (301)
        if path.endswith(".html"):
            clean = "/" if path == "/index.html" else path[: -len(".html")]
            self.send_response(301)
            self.send_header("Location", clean + query)
            self.end_headers()
            return

        # /pagina -> pagina.html (si existe)
        if path == "/":
            self.path = "/index.html" + query
        elif "." not in os.path.basename(path):
            candidate = os.path.join(ROOT, path.lstrip("/").rstrip("/") + ".html")
            if os.path.isfile(candidate):
                self.path = path.rstrip("/") + ".html" + query

        super().do_GET()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
    server = http.server.ThreadingHTTPServer(("127.0.0.1", port), CleanURLHandler)
    print(f"Sirviendo {ROOT} en http://localhost:{port}")
    server.serve_forever()
