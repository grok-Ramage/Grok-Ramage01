# Grok-Ramage01

**Status:** `IMPLEMENTATION`  
**Predecessor:** [Grok-Ramage00](https://github.com/grok-Ramage/Grok-Ramage00)  
**Owned family:** quantum S_q  
**Owned object:** Sigma_Sq

This is the new project. It implements solutions. It does not hunt Sigma_ReS.

Fold Hunt search is frozen in 00. On scanned ReS charts, witness is 0. 01 may read those charts as fixtures. 01 may not write a ReS fold CERT from them.

## First sentence (owned)

S_q(u; alpha) = u^3/3 - alpha u

Fold at (alpha, u) = (0, 0):
F = u^2 - alpha = 0, H = 2u = 0, a2 = 1.

That pair is Sigma_Sq. Airy models the wave on Sigma_Sq. Airy does not prove a fold of ReS.

## What 01 builds first

1. Analytic germ and jets of S_q (`src/sq_germ.py`).
2. Admission that refuses mixed ledgers (`src/admit.py`).
3. Read-only fixtures copied from 00 (`fixtures/`).

## What 01 refuses

- Restencil of 00 closed ReS charts.
- a1 and q_c in one sentence.
- Sigma_Sq = Sigma_ReS.
- Unfolding the anti-glue family.
- Productizing a 24D ReS solver as a hunt CERT.
- GPU as a default device for classification.

## Run

```bash
python3 scripts/run_sq.py
python3 -m unittest discover -s tests -q
```
