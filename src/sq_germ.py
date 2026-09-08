"""Analytic germ of S_q.

S_q(u; alpha) = u^3 / 3 - alpha u
F = dS/du = u^2 - alpha
H = dF/du = 2u
a2 = 1

Fold of this family only at (alpha, u) = (0, 0) = Sigma_Sq.
This module does not classify ReS and does not import hunt agents.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SqPoint:
    alpha: float
    u: float
    S: float
    F: float
    H: float
    a2: float
    on_sigma: bool


class SqGerm:
    """Owned potential of Grok-Ramage01."""

    family = "quantum"
    claim = "A2_Sq"
    a2 = 1.0

    def S(self, u: float, alpha: float) -> float:
        return (u**3) / 3.0 - alpha * u

    def F(self, u: float, alpha: float) -> float:
        return u * u - alpha

    def H(self, u: float) -> float:
        return 2.0 * u

    def point(self, u: float, alpha: float) -> SqPoint:
        F = self.F(u, alpha)
        H = self.H(u)
        if alpha == 0.0 and u == 0.0:
            on_sigma = True
        else:
            on_sigma = False
        return SqPoint(
            alpha=alpha,
            u=u,
            S=self.S(u, alpha),
            F=F,
            H=H,
            a2=self.a2,
            on_sigma=on_sigma,
        )

    def is_sigma(self, u: float, alpha: float) -> bool:
        return alpha == 0.0 and u == 0.0

    def stokes_ray_args(self) -> tuple[float, float, float]:
        from math import pi

        return (0.0, 2.0 * pi / 3.0, -2.0 * pi / 3.0)


sigma_sq = SqGerm().point(0.0, 0.0)
