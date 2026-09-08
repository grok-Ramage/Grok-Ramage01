#!/usr/bin/env python3
"""Print the owned Sigma_Sq point and a few admission checks."""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.admit import admit
from src.sq_germ import SqGerm, sigma_sq


def main() -> None:
    g = SqGerm()
    print("family", g.family)
    print("claim", g.claim)
    print("sigma_sq", sigma_sq)
    print("stokes_args", g.stokes_ray_args())
    print("off_fold", g.point(1.0, 0.5))

    checks = [
        "S_q = u^3/3 - alpha u; fold at alpha=0, u=0",
        "Airy models the wave on the Thom fold of S_q",
        "a1 of ReS equals q_c",
        "Sigma_Sq therefore Sigma_ReS",
        "restencil the 24D window",
    ]
    print("admission")
    for s in checks:
        v = admit(s)
        print(json.dumps({"sentence": s, "admit": v.admit, "gate": v.gate, "reason": v.reason}))


if __name__ == "__main__":
    main()
