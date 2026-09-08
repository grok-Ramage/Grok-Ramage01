"""Barrett seed property checklist.

Classifies constructions, not points of ReS.
Never calls Newton and never restencils closed 00 charts.
"""

from __future__ import annotations

from dataclasses import dataclass

CLOSED = frozenset(
    {
        "window_eps",
        "window_eps2",
        "kappa_positive",
        "pmin_vs_f0",
        "anti_glue_sep",
        "10d_regular",
        "lostlab_ad_kappa",
        "planted_a2",
        "plug24_cubic_as_lostlab",
    }
)

AXES = frozenset(
    {
        "different_2complex",
        "degenerate_vector_geometry",
        "area_angle_primary",
        "lorentzian_barrett_williams",
        "reconstruction_from_normals",
    }
)


@dataclass(frozen=True)
class SeedProposal:
    name: str
    two_complex: str
    variables: tuple[str, ...]
    degeneracy: str
    signature: str
    glue: str
    axis: str
    closed_chart: str | None = None


@dataclass(frozen=True)
class ConstructionVerdict:
    construction: bool
    licensed_to_newton: bool
    reason: str
    axis: str | None


def classify(proposal: SeedProposal) -> ConstructionVerdict:
    if proposal.closed_chart in CLOSED or proposal.name in CLOSED:
        return ConstructionVerdict(
            False,
            False,
            "closed 00 chart or planted control; not a new Barrett seed",
            None,
        )
    if proposal.axis not in AXES:
        return ConstructionVerdict(False, False, "axis not in licensed construction list", None)
    if not proposal.two_complex.strip() or not proposal.variables:
        return ConstructionVerdict(
            False, False, "construction requires a written 2-complex and variable list", proposal.axis
        )
    if proposal.glue in {"anti_glue_parallel", "kappa_to_inf", "bordered_newton_P0"}:
        return ConstructionVerdict(False, False, "glue law is a closed 00 rule", proposal.axis)
    return ConstructionVerdict(
        True,
        False,
        "construction language accepted; Newton remains off until a 00 cert names this variable list",
        proposal.axis,
    )


KNOWN_REFUSED = (
    SeedProposal("window_eps", "1-simplex window", ("eps",), "nondegenerate", "spin4", "none", "different_2complex", "window_eps"),
    SeedProposal("anti_glue_sep", "two-vertex Ad_kappa", ("sep", "kappa"), "nondegenerate", "spin4", "anti_glue_parallel", "different_2complex", "anti_glue_sep"),
    SeedProposal("planted_a2", "planted cubic", ("eps",), "planted", "toy", "none", "planted_a2", "planted_a2"),
)
