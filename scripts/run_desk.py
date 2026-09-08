#!/usr/bin/env python3
import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from src.barrett_seed import KNOWN_REFUSED, SeedProposal, classify
from src.desk_frame import legal_frame, svg_desk
from src.wave_layer import sample_real_line, stokes_connection_residual, stokes_rays

def main():
    out = ROOT / "artifacts"
    out.mkdir(exist_ok=True)
    legal = legal_frame("S_q fold at alpha=0, u=0; Airy models the wave on Sigma_Sq")
    illegal = legal_frame("a1 of ReS equals q_c")
    (out / "desk_legal.svg").write_text(svg_desk(legal))
    (out / "desk_illegal.svg").write_text(svg_desk(illegal))
    print("stokes_rays", stokes_rays())
    print("connection_|r|", abs(stokes_connection_residual(0.7)))
    print("wave_sample", json.dumps(sample_real_line([-1.0, 0.0, 1.0])))
    print("desk_legal", legal.paint, legal.reason)
    print("desk_illegal", illegal.paint, illegal.reason)
    for p in KNOWN_REFUSED:
        v = classify(p)
        print(json.dumps({"name": p.name, "construction": v.construction, "newton": v.licensed_to_newton}))

if __name__ == "__main__":
    main()
