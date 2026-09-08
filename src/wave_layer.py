"""Wave layer of S_q.

I(alpha, hbar) = 2 pi hbar^{1/3} Ai(-alpha / hbar^{2/3})

hbar dresses the WKB wave and is not a control.
Airy models the wave on Sigma_Sq. Airy does not prove a fold of ReS.
Stokes rays sit at arg(alpha) = 0, +/- 2 pi/3. hbar does not move those angles.
"""

from __future__ import annotations

from math import pi
from typing import Sequence

import numpy as np
from scipy.special import airy

from .sq_germ import SqGerm

OMEGA = np.exp(2j * np.pi / 3)
STOKES_ARGS = (0.0, 2.0 * pi / 3.0, -2.0 * pi / 3.0)


def airy_ai(z):
    return airy(z)[0]


def I(alpha, hbar: float = 1.0):
    if hbar <= 0:
        raise ValueError("hbar dresses the wave and must be positive; it is not a control")
    scale = hbar ** (1.0 / 3.0)
    z = -np.asarray(alpha, dtype=complex) / (hbar ** (2.0 / 3.0))
    return 2.0 * pi * scale * airy_ai(z)


def stokes_connection_residual(alpha: float, hbar: float = 1.0) -> complex:
    a = complex(alpha)
    return I(a, hbar) + OMEGA * I(OMEGA * a, hbar) + (OMEGA**2) * I((OMEGA**2) * a, hbar)


def stokes_rays() -> tuple[float, float, float]:
    return STOKES_ARGS


def wave_on_sigma(hbar: float = 1.0) -> complex:
    germ = SqGerm()
    if not germ.is_sigma(0.0, 0.0):
        raise RuntimeError("owned germ moved")
    return I(0.0, hbar)


def sample_real_line(alphas: Sequence[float], hbar: float = 1.0) -> list[dict]:
    rows = []
    for a in alphas:
        val = I(a, hbar)
        rows.append(
            {
                "alpha": float(a),
                "hbar": float(hbar),
                "I_real": float(np.real(val)),
                "I_imag": float(np.imag(val)),
                "on_sigma": a == 0.0,
            }
        )
    return rows
