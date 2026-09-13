# Desk-build hardware — support tool

Status: `support_tool`  
Owner: Grok-Ramage01  
Classify device: **CPU** (G5)  
Display device: **GPU** (WebGL, this machine's RTX 2060)  
Hub: https://github.com/grok-Ramage/Grok-Ramage-Project-Desk

Local CPU and GPU support the **building and viewing** of Project Desk.
They do not classify S_q. They do not make the hub an execution engine.

## Split

| Job | Device | Why |
|---|---|---|
| `admit()` / G5 | CPU or TEXT | GPU default classification stays refused |
| Legal lattice α + g = u² | CPU (i5-9600K, 6 cores) | Exact hundredths; numpy |
| Catalog + A2 surface | GPU display (RTX 2060) | WebGL2 `powerPreference: high-performance` |
| Pointer sync | CPU + `gh` | `scripts/sync_pointers.py` on the hub |

## Files

- `hardware.py` — probe CPU/GPU, write `out/hardware.json`
- `legal_lattice.py` — CPU scan, write `out/legal_lattice.json`
- `serve.py` — serve the GPU viewer
- `viewer/` — WebGL Project Desk (reads `landscape.json`)

## What this is not

- Not a family charter
- Not a G5 lift (GPU still fails `admit(..., device="GPU")`)
- Not Sigma_Sq identified with Sigma_ReS
- Not a construction inside the hub catalog
- Not optical caustics as Sigma_Sq
- Not CuPy/CUDA classification

Reopen GPU as a classify device only by changing G5 with a named gate, a fixture, and a sentence for what it is not.
