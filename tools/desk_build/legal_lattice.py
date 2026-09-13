"""CPU legal lattice for the A2 instrument.

Hundredths scan: u, α ∈ [-2, 2], g ∈ [-1, 1], Δ = 0.01.
Legal iff α + g = u² (integer-cent exact).
CUSP: u = 0 (H = 0). FOLD: otherwise.
Device: CPU. This module does not call admit() with GPU.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "out"

U_MIN, U_MAX = -200, 200
A_MIN, A_MAX = -200, 200
G_MIN, G_MAX = -100, 100


def scan() -> dict:
    points = []
    n_cusp = 0
    max_id = 0.0
    max_f = 0.0
    for u_c in range(U_MIN, U_MAX + 1):
        u2 = u_c * u_c
        if u2 % 100 != 0:
            continue
        u2_h = u2 // 100
        u = u_c / 100.0
        for g_c in range(G_MIN, G_MAX + 1):
            a_c = u2_h - g_c
            if a_c < A_MIN or a_c > A_MAX:
                continue
            alpha = a_c / 100.0
            g = g_c / 100.0
            s = (u ** 3) / 3.0 - (alpha + g) * u
            ident = abs(s + (2.0 * u ** 3) / 3.0)
            f_res = abs(u * u - (alpha + g))
            if ident > max_id:
                max_id = ident
            if f_res > max_f:
                max_f = f_res
            kind = "CUSP" if u_c == 0 else "FOLD"
            if kind == "CUSP":
                n_cusp += 1
            points.append({
                "a": round(alpha, 2),
                "u": round(u, 2),
                "g": round(g, 2),
                "S": s,
                "kind": kind,
            })
    n_fold = len(points) - n_cusp
    return {
        "device": "CPU",
        "delta": 0.01,
        "law": "alpha + g = u^2",
        "count": len(points),
        "cusp": n_cusp,
        "fold": n_fold,
        "semicubical_residual": max_id,
        "F_residual": max_f,
        "points": points,
    }


def write_scan(path: Path | None = None, slim: bool = True) -> dict:
    data = scan()
    dest = path or (OUT / "legal_lattice.json")
    dest.parent.mkdir(parents=True, exist_ok=True)
    payload = dict(data)
    if slim:
        payload["points"] = [
            {"a": p["a"], "u": p["u"], "g": p["g"], "S": p["S"], "kind": p["kind"]}
            for p in data["points"]
        ]
    dest.write_text(json.dumps(payload), encoding="utf-8")
    summary = {k: data[k] for k in data if k != "points"}
    (OUT / "legal_lattice_summary.json").write_text(
        json.dumps(summary, indent=2) + "\n", encoding="utf-8"
    )
    return data


def main() -> int:
    data = write_scan()
    print(json.dumps({k: data[k] for k in data if k != "points"}, indent=2))
    print("wrote", OUT / "legal_lattice.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
