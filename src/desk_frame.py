"""Legal 4-slot holographic frame for Grok-Ramage01.

Slots: [r0, r+, r-, germ]
Paint only after a legal quantum / A2_Sq superposition.
Illegal mixed ledgers stay dark (NO PAINT).
"""

from __future__ import annotations

from dataclasses import dataclass

from .admit import admit
from .sq_germ import SqGerm, sigma_sq
from .wave_layer import I, STOKES_ARGS, stokes_connection_residual

SLOTS = ("r0", "r+", "r-", "germ")
INK = "#e8ebe4"
PAPER = "#0b0c0b"
SAGE = "#7f8f78"
BRICK = "#a65d4e"
MUTED = "#3a3d3a"


@dataclass(frozen=True)
class Frame:
    r0: complex
    r_plus: complex
    r_minus: complex
    germ: complex
    paint: bool
    reason: str

    def as_tuple(self):
        return (self.r0, self.r_plus, self.r_minus, self.germ)


def legal_frame(sentence: str, hbar: float = 1.0) -> Frame:
    verdict = admit(sentence, claim="A2_Sq", family="quantum", device="CPU")
    if not verdict.admit:
        return Frame(0j, 0j, 0j, 0j, False, f"NO PAINT {verdict.gate}: {verdict.reason}")
    g = SqGerm()
    return Frame(
        I(0.0, hbar),
        I(complex(STOKES_ARGS[1]), hbar),
        I(complex(STOKES_ARGS[2]), hbar),
        complex(g.a2),
        True,
        "PAINT legal A2_Sq frame",
    )


def svg_desk(frame: Frame, width: int = 720, height: int = 420) -> str:
    slot_w, gap, y = 140, 28, 150
    x0 = (width - (4 * slot_w + 3 * gap)) / 2
    cells = []
    for i, (lab, val) in enumerate(zip(SLOTS, frame.as_tuple())):
        x = x0 + i * (slot_w + gap)
        fill = SAGE if frame.paint else MUTED
        stroke = INK if frame.paint else BRICK
        shown = _fmt(val) if frame.paint else "-"
        cells.append(
            f'<rect x="{x:.1f}" y="{y}" width="{slot_w}" height="96" fill="{fill}" stroke="{stroke}" stroke-width="1.2"/>'
            f'<text x="{x + slot_w/2:.1f}" y="{y + 28}" text-anchor="middle" fill="{PAPER}" font-family="monospace" font-size="13">{lab}</text>'
            f'<text x="{x + slot_w/2:.1f}" y="{y + 62}" text-anchor="middle" fill="{PAPER}" font-family="monospace" font-size="11">{shown}</text>'
        )
    status = "PAINT" if frame.paint else "NO PAINT"
    status_col = SAGE if frame.paint else BRICK
    residual = stokes_connection_residual(0.7)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">'
        f'<rect width="100%" height="100%" fill="{PAPER}"/>'
        f'<text x="{width/2}" y="36" text-anchor="middle" fill="{INK}" font-family="monospace" font-size="16">Grok-Ramage01 desk</text>'
        f'<text x="{width/2}" y="88" text-anchor="middle" fill="{status_col}" font-family="monospace" font-size="13">{status}</text>'
        f'<text x="{width/2}" y="110" text-anchor="middle" fill="{INK}" font-family="monospace" font-size="11">{_esc(frame.reason)}</text>'
        + "".join(cells)
        + f'<text x="{width/2}" y="312" text-anchor="middle" fill="{SAGE}" font-family="monospace" font-size="11">connection residual {_fmt(residual)}</text>'
        f'<text x="{width/2}" y="348" text-anchor="middle" fill="{MUTED}" font-family="monospace" font-size="11">owned germ a2={sigma_sq.a2:g}</text>'
        f'</svg>\n'
    )


def _fmt(z: complex) -> str:
    if abs(z.imag) < 1e-12:
        return f"{z.real:.4g}"
    return f"{z.real:.3g}{z.imag:+.3g}j"


def _esc(s: str) -> str:
    return s.replace("&", "&").replace("<", "<").replace(">", ">")
