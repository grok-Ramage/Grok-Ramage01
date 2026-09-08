"""Admission for Grok-Ramage01 sentences.

Left-to-right conjunction. First false predicate stops the chain.
This is not a fold witness of ReS.
"""

from __future__ import annotations

from dataclasses import dataclass
import re


MIXED = re.compile(r"\ba1\b.*\bq_c\b|\bq_c\b.*\ba1\b", re.I)
TRANSFER = re.compile(
    r"sigma_sq\s*(is|=|equals|therefore)\s*sigma_res|therefore\s+res\s+has\s+a\s+fold|ai therefore sigma_res",
    re.I,
)
RESTENCIL = re.compile(
    r"restencil|unfold the anti-glue|stencil the 24d window|eps\s*in\s*\[\s*3\.3",
    re.I,
)


@dataclass(frozen=True)
class Verdict:
    admit: bool
    gate: str
    reason: str
    family: str | None
    claim: str | None


def admit_job(
    sentence: str,
    claim: str = "A2_Sq",
    family: str = "quantum",
    device: str = "CPU",
) -> Verdict:
    text = sentence.strip()

    if not text:
        return Verdict(False, "G-M", "empty sentence", None, None)

    if MIXED.search(text):
        return Verdict(False, "G0", "mixed a1 with q_c", family, claim)

    if family not in {"quantum", "hunt", "hydro", "glue"}:
        return Verdict(False, "G1", "unknown family", family, claim)
    if family != "quantum" and claim == "A2_Sq":
        return Verdict(False, "G1", "A2_Sq is owned by family quantum", family, claim)

    if claim == "A2_Sq" and family != "quantum":
        return Verdict(False, "G2", "A2_Sq only on quantum", family, claim)
    if claim == "fold_ReS":
        return Verdict(
            False,
            "G2",
            "fold_ReS is a 00 hunt claim; 01 does not certify Sigma_ReS",
            family,
            claim,
        )

    if RESTENCIL.search(text):
        return Verdict(False, "G3", "closed ReS chart restencil refused", family, claim)

    if TRANSFER.search(text):
        return Verdict(False, "G4", "Sigma_Sq is not Sigma_ReS", family, claim)

    if device.upper() not in {"CPU", "TEXT"}:
        return Verdict(False, "G5", "device must be CPU or TEXT", family, claim)

    if re.search(r"\bD_sys\b", text):
        return Verdict(False, "G6", "retired metric D_sys", family, claim)

    if family == "quantum" and claim == "A2_Sq":
        return Verdict(True, "ADMIT", "legal A2_Sq sentence", family, claim)

    return Verdict(True, "ADMIT", "legal text, not a ReS fold witness", family, claim)


def admit(sentence: str, **kwargs) -> Verdict:
    return admit_job(sentence, **kwargs)
