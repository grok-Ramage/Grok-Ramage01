# Critical Curves and Caustics of a Sheared Point Lens — Corrected Derivation

Companion file: `lens_verification.js` (runnable under Node or in a browser; every
numbered claim below is checked live by `runVerification(gamma)` in that file).

## Setup

Point mass lens with external shear γ. γ is taken real, WLOG aligned with the
real axis (a general complex shear γe^{2iφ_γ} can always be rotated into this
form). Lengths are in units of the Einstein radius, θ_E = 1.

$$\zeta(z) = z - \gamma\bar z - \frac{1}{\bar z}$$

## Jacobian and critical curve

Wirtinger derivatives:

$$\frac{\partial\zeta}{\partial z} = 1, \qquad \frac{\partial\zeta}{\partial\bar z} = \frac{1}{\bar z^2}-\gamma$$

$$\det J = 1 - \left|\frac{1}{\bar z^2}-\gamma\right|^2 = 0 \iff \left|\frac{1}{\bar z^2}-\gamma\right|=1$$

Parametrize by θ ∈ [0, 2π), anchored through **z**:

$$\frac{1}{z^2} = \gamma + e^{i\theta}$$

## The step that has to be handled carefully

θ above is defined via z, not z̄. Using it in anything built from ∂ζ/∂z̄
requires conjugating first (γ, θ real):

$$\overline{\left(\frac{1}{z^2}\right)} = \overline{\gamma+e^{i\theta}} \;\Longrightarrow\; \frac{1}{\bar z^2} = \gamma + e^{-i\theta} \;\Longrightarrow\; \frac{1}{\bar z^2}-\gamma = e^{-i\theta}$$

**This is the line to get right.** It's $e^{-i\theta}$, not $e^{i\theta}$.
Substituting $e^{+i\theta}$ here — reusing θ's own defining relation instead of
its conjugate — is a natural slip, and it silently passes any check done only
at θ = 0 and θ = π, because $e^{i\theta}=e^{-i\theta}$ at exactly those two
angles. It fails at every other θ (confirmed numerically in
`lens_verification.js`: at θ = 1.0 rad the two versions disagree by more than
a factor of 2 in magnitude — see the comment block at the top of that file).

## Tangent vector along the critical curve

Differentiating $1/z^2 = \gamma+e^{i\theta}$:

$$\frac{dz}{d\theta} = -\frac{i}{2}z^3 e^{i\theta}, \qquad \frac{d\bar z}{d\theta} = \frac{i}{2}\bar z^3 e^{-i\theta} \quad(\text{conjugate})$$

$$\frac{d\zeta}{d\theta} = \frac{dz}{d\theta} + \left(\frac{1}{\bar z^2}-\gamma\right)\frac{d\bar z}{d\theta} = \frac{dz}{d\theta} + e^{-i\theta}\frac{d\bar z}{d\theta} = \frac{i}{2}\left(\bar z^3 e^{-2i\theta} - z^3 e^{i\theta}\right)$$

## Cusp condition

$$\frac{d\zeta}{d\theta}=0 \iff \bar z^3 = z^3 e^{3i\theta}$$

- **θ = 0:** $\bar z^3 = z^3 \Rightarrow z\in\mathbb R \Rightarrow z = \pm\dfrac{1}{\sqrt{1+\gamma}}$
- **θ = π:** $\bar z^3 = z^3 e^{3i\pi} = -z^3 \Rightarrow z\in i\mathbb R \Rightarrow z = \pm\dfrac{i}{\sqrt{1-\gamma}}$

(Both z-values also follow directly and independently from the critical-curve
equation alone at θ = 0, π — $1/z^2=\gamma+1$ or $\gamma-1$ respectively — so
they don't depend on resolving the sign subtlety above. Only the *general*
formula for intermediate θ does.)

## Cusp positions in the source plane

**Horizontal:**

$$\zeta_{\text{cusp},x} = (1-\gamma)z - \frac1z \bigg|_{z=\pm 1/\sqrt{1+\gamma}} = \mp\frac{2\gamma}{\sqrt{1+\gamma}}$$

Sign note: the $z=+1/\sqrt{1+\gamma}$ root gives $\zeta=-2\gamma/\sqrt{1+\gamma}$,
and $z=-1/\sqrt{1+\gamma}$ gives $+2\gamma/\sqrt{1+\gamma}$ — the pairing
flips. The *set* of cusp locations, $\{+2\gamma/\sqrt{1+\gamma},\,
-2\gamma/\sqrt{1+\gamma}\}$, is what's meaningful, and is correct either way.
(`lens_verification.js` compares by magnitude for exactly this reason.)

**Vertical:**

$$\zeta_{\text{cusp},y} = (1+\gamma)z+\frac1z\bigg|_{z=\pm i/\sqrt{1-\gamma}} = \pm\frac{2i\gamma}{\sqrt{1-\gamma}}$$

Here the sign pairing matches directly: $z=+i/\sqrt{1-\gamma}$ gives
$+2i\gamma/\sqrt{1-\gamma}$.

**Worked example, γ = 0.3:** horizontal cusps at ζ ≈ ±0.526235, vertical
cusps at ζ ≈ ±0.717137i.

## Completeness — why only these two angles

Write $\gamma+e^{i\theta} \equiv Re^{i\alpha}$. The critical-curve equation
fixes $\arg z = -\alpha/2 \pmod \pi$, and substituting into the cusp condition
reduces it to a single real equation in θ:

$$\alpha(\theta) \equiv \theta \pmod{2\pi/3}$$

Since

$$\alpha'(\theta) = \frac{1+\gamma\cos\theta}{R^2} > 0 \quad \text{for all } |\gamma|<1$$

α is strictly increasing, so $F(\theta):=\alpha(\theta)-\theta$ has exactly
one interior extremum on $(0,\pi)$ and one on $(\pi, 2\pi)$, with
$F(0)=F(\pi)=F(2\pi)=0$. A function with a single interior extremum between
two equal endpoint values cannot cross zero again in between — so $F=0$ only
at θ = 0, π.

That rules out the residue "0" being hit anywhere else. It does *not*, by
itself, rule out $F$ hitting the other two residues, $\pm2\pi/3$, somewhere in
between. `lens_verification.js`'s cusp-finder (test 3) closes that gap
empirically: it scans the *entire* curve via an independent,
branch-cut-free parametrization (polar angle φ = arg z, sidestepping θ
altogether) and confirms exactly four cusps for every γ tested, all within
0.05° of {0°, 90°, 180°, 270°}.

## Assumptions and domain of validity

- γ real, shear aligned with the real axis (WLOG, per above).
- Lengths in units of the Einstein radius (θ_E = 1) in both planes.
- Valid for |γ| < 1: single closed critical curve, exactly 4 cusps — the
  standard point-mass-plus-external-shear configuration, often called the
  Chang–Refsdal lens.
- As γ → 1⁻, the vertical cusps diverge (∝ 1/√(1−γ)); γ = 1 is a genuine
  bifurcation of the topology and is out of scope here.
- This models a point mass perturbed by *uniform* external shear — the
  standard idealization for, e.g., a star perturbed by a distant companion,
  not a full multi-body or extended-mass treatment.
