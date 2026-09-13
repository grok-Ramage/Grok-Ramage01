"""Serve the GPU Project Desk viewer. Display only. Classify stays on CPU."""
from __future__ import annotations

import argparse
import sys
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
HUB = ROOT.parents[2] / "Grok-Ramage-Project-Desk"
VIEW = ROOT / "viewer"
OUT = ROOT / "out"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(VIEW), **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def do_GET(self):  # noqa: N802
        if self.path.split("?", 1)[0] == "/landscape.json":
            return self._send_file(HUB / "landscape.json", "application/json")
        if self.path.split("?", 1)[0] == "/hardware.json":
            return self._send_file(OUT / "hardware.json", "application/json")
        if self.path.split("?", 1)[0] == "/legal_lattice.json":
            return self._send_file(OUT / "legal_lattice.json", "application/json")
        if self.path.split("?", 1)[0] == "/legal_lattice_summary.json":
            return self._send_file(OUT / "legal_lattice_summary.json", "application/json")
        return super().do_GET()

    def _send_file(self, path: Path, ctype: str) -> None:
        if not path.is_file():
            self.send_error(404, "missing " + path.name)
            return
        data = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8766)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()
    sys.path.insert(0, str(ROOT))
    from hardware import write_probe
    from legal_lattice import write_scan

    hw = write_probe()
    scan = write_scan()
    print("classify_device", hw["classify_device"])
    print("display_device", hw["display_device"], hw.get("gpu", {}).get("name"))
    print("lattice", scan["count"], "cusp", scan["cusp"], "fold", scan["fold"])
    httpd = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    url = "http://127.0.0.1:%d/" % args.port
    print("GPU viewer", url)
    if not args.no_browser:
        webbrowser.open(url)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("stop")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
