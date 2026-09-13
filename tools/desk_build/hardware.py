"""Probe local CPU/GPU for desk-build. Display inventory only. Not a classify device."""
from __future__ import annotations

import json
import os
import platform
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "out"


def _run(cmd: list[str]) -> str:
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        return (r.stdout or r.stderr or "").strip()
    except (OSError, subprocess.TimeoutExpired):
        return ""


def probe() -> dict:
    cpu = {
        "name": platform.processor() or platform.machine(),
        "logical": os.cpu_count() or 1,
        "system": platform.system(),
        "machine": platform.machine(),
    }
    smi = _run([
        "nvidia-smi",
        "--query-gpu=name,driver_version,memory.total,memory.used,utilization.gpu",
        "--format=csv,noheader",
    ])
    gpu = {"present": bool(smi), "nvidia_smi": smi, "role": "display_only"}
    if smi:
        parts = [p.strip() for p in smi.split(",")]
        if len(parts) >= 3:
            gpu.update({
                "name": parts[0],
                "driver": parts[1],
                "memory": parts[2],
            })
    return {
        "classify_device": "CPU",
        "display_device": "GPU" if gpu["present"] else "CPU",
        "g5": "GPU admit remains REFUSE",
        "cupy": False,
        "cpu": cpu,
        "gpu": gpu,
        "numpy": True,
    }


def write_probe(path: Path | None = None) -> dict:
    data = probe()
    dest = path or (OUT / "hardware.json")
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    return data


def main() -> int:
    data = write_probe()
    print(json.dumps(data, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
