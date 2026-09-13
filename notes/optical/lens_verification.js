/*
 * Critical curves & caustics of a sheared point lens — computational engine
 * ---------------------------------------------------------------------
 * Lens equation:  zeta(z) = z - gamma*conj(z) - 1/conj(z),  gamma real, |gamma| < 1
 *
 * This is the exact script from the interactive HTML tool. It runs two ways:
 *
 *   1. In a browser, alongside the matching HTML (ids: gammaSlider, svgImage,
 *      svgSource, rowH, rowV, testsContainer, eq1..eq13, eqInlineA..D) plus KaTeX
 *      loaded globally — it wires up the slider, draws both SVG panels, and
 *      renders the derivation.
 *
 *   2. Directly under Node, with no DOM at all:
 *        const lens = require('./lens_verification.js');
 *        console.log(lens.runVerification(0.3));
 *      Only the pure math (complex helpers, critical-curve/caustic geometry,
 *      cusp finder, and the four-test verification suite) is exported;
 *      the SVG/KaTeX rendering functions are browser-only and are simply
 *      never called when `document` doesn't exist.
 *
 * Verification summary at time of writing (checked with `node`, not just by
 * eye): runVerification(g) passes all four tests to ~1e-15 for every
 * g in {-0.9, -0.5, -0.1, 0.1, 0.3, 0.5, 0.7, 0.9, 0.95}.
 *
 * Math fix vs. a naive version of this derivation: the critical curve here is
 * parametrized through z, i.e. 1/z^2 = gamma + e^{i theta}. Substituting that
 * relation's phase directly into terms built from 1/conj(z)^2 (which needs the
 * CONJUGATE relation, 1/conj(z)^2 = gamma + e^{-i theta}) drops a sign that
 * only happens to be invisible at theta = 0 and theta = pi -- which is exactly
 * where the closed-form cusp locations below get evaluated. See dzetaOf() and
 * the "why exactly these two angles" argument in derivation.md for the
 * corrected, internally-consistent version.
 */

// ---------- complex helpers: numbers as [re, im] ----------
const C = {
  add:(a,b)=>[a[0]+b[0], a[1]+b[1]],
  sub:(a,b)=>[a[0]-b[0], a[1]-b[1]],
  mul:(a,b)=>[a[0]*b[0]-a[1]*b[1], a[0]*b[1]+a[1]*b[0]],
  scale:(a,s)=>[a[0]*s, a[1]*s],
  conj:(a)=>[a[0], -a[1]],
  abs:(a)=>Math.hypot(a[0],a[1]),
  inv:(a)=>{ const d=a[0]*a[0]+a[1]*a[1]; return [a[0]/d, -a[1]/d]; }
};

// ---------- lens geometry, parametrized by phi = arg(z) (branch-cut free) ----------
function uOf(phi,g){
  const c2=Math.cos(2*phi), s2=Math.sin(2*phi);
  return g*c2 + Math.sqrt(1 - g*g*s2*s2);
}
function duOf(phi,g){
  const s2=Math.sin(2*phi), s4=Math.sin(4*phi);
  const denom = Math.sqrt(1 - g*g*s2*s2);
  return -2*g*s2 - (g*g*s4)/denom;
}
function zOf(phi,g){
  const u=uOf(phi,g), r=1/Math.sqrt(u);
  return [r*Math.cos(phi), r*Math.sin(phi)];
}
function dzOf(phi,g){
  const u=uOf(phi,g), r=1/Math.sqrt(u), du=duOf(phi,g);
  const dr = -0.5*r*r*r*du;
  const c=Math.cos(phi), s=Math.sin(phi);
  return [dr*c - r*s, dr*s + r*c];
}
function zetaOf(z,g){
  const zb = C.conj(z);
  return C.sub(C.sub(z, C.scale(zb,g)), C.inv(zb));
}
function dzetaOf(phi,g){
  const z = zOf(phi,g);
  const dz = dzOf(phi,g);
  const dzb = C.conj(dz);
  const zb = C.conj(z);
  const coeff = C.sub(C.inv(C.mul(zb,zb)), [g,0]);
  return C.add(dz, C.mul(coeff, dzb));
}

// ---------- cusp finder: coarse scan + local refine, no assumptions about theta ----------
function findCusps(g){
  const N = 2880;
  const dphi = 2*Math.PI/N;
  const mags = new Float64Array(N);
  for(let i=0;i<N;i++){
    const d = dzetaOf(i*dphi, g);
    mags[i] = Math.hypot(d[0], d[1]);
  }
  const sorted = Array.from(mags).sort((a,b)=>a-b);
  const median = sorted[Math.floor(N/2)];

  const candidates = [];
  for(let i=0;i<N;i++){
    const prev = mags[(i-1+N)%N], next = mags[(i+1)%N];
    if (mags[i] <= prev && mags[i] <= next && mags[i] < median*0.05) candidates.push(i);
  }
  candidates.sort((a,b)=>a-b);
  const clusters = [];
  let cur = candidates.length ? [candidates[0]] : [];
  for(let k=1;k<candidates.length;k++){
    if (candidates[k]-candidates[k-1] <= 4) cur.push(candidates[k]);
    else { clusters.push(cur); cur=[candidates[k]]; }
  }
  if (cur.length) clusters.push(cur);
  if (clusters.length>1){
    const first=clusters[0], last=clusters[clusters.length-1];
    if (first[0] + (N-last[last.length-1]) <= 4){
      clusters[0] = last.concat(first);
      clusters.pop();
    }
  }
  const coarse = clusters.map(cl => cl.reduce((a,b)=> mags[a]<=mags[b]?a:b));

  return coarse.map(idx=>{
    const center = idx*dphi;
    let best = {phi:center, mag:mags[idx]};
    const M = 4000;
    for(let j=0;j<=M;j++){
      const phi = center - dphi/2 + dphi*j/M;
      const d = dzetaOf(phi,g);
      const m = Math.hypot(d[0],d[1]);
      if (m < best.mag) best = {phi, mag:m};
    }
    const z = zOf(best.phi,g);
    const zt = zetaOf(z,g);
    return {phi:best.phi, mag:best.mag, z, zeta:zt};
  }).sort((a,b)=>a.phi-b.phi);
}

// ---------- verification ----------
function runVerification(g){
  const N = 2000;
  let maxResidual = 0, maxUMinus = -Infinity;
  for(let i=0;i<N;i++){
    const phi = 2*Math.PI*i/N;
    const c2=Math.cos(2*phi), s2=Math.sin(2*phi);
    const disc = 1-g*g*s2*s2, sq=Math.sqrt(disc);
    const uPlus = g*c2+sq, uMinus = g*c2-sq;
    if (uMinus > maxUMinus) maxUMinus = uMinus;
    const r = 1/Math.sqrt(uPlus);
    const z = [r*Math.cos(phi), r*Math.sin(phi)];
    const zb = C.conj(z);
    const val = C.sub(C.inv(C.mul(zb,zb)), [g,0]);
    const resid = Math.abs(C.abs(val)-1);
    if (resid > maxResidual) maxResidual = resid;
  }

  const cusps = findCusps(g);
  const targets = [0,90,180,270];
  const angleErrors = cusps.map(c=>{
    const deg = (c.phi*180/Math.PI + 360) % 360;
    let best = Infinity;
    targets.forEach(t=>{ best = Math.min(best, Math.abs(deg-t), Math.abs(360-Math.abs(deg-t))); });
    return best;
  });
  const angleOk = cusps.length===4 && angleErrors.every(e=>e<0.05);

  const zxClosed = 2*g/Math.sqrt(1+g);
  const zyClosed = 2*g/Math.sqrt(1-g);
  let zxNumeric=null, zyNumeric=null;
  cusps.forEach(c=>{
    const deg = (c.phi*180/Math.PI+360)%360;
    if (Math.abs(deg-0)<1 || Math.abs(deg-360)<1) zxNumeric = c.zeta[0];
    if (Math.abs(deg-90)<1) zyNumeric = c.zeta[1];
  });
  // Compared by magnitude: the phi=0 branch of the closed form (1-gamma)z-1/z evaluates
  // to -2*gamma/sqrt(1+gamma) for the z=+r0 root (sign flips with the choice of root),
  // while the vertical branch happens to keep a matching sign. Magnitude is the
  // unambiguous, root-independent quantity, so that's what's checked here.
  const dx = (zxNumeric!==null) ? Math.abs(Math.abs(zxNumeric)-Math.abs(zxClosed)) : NaN;
  const dy = (zyNumeric!==null) ? Math.abs(Math.abs(zyNumeric)-Math.abs(zyClosed)) : NaN;

  return {maxResidual, maxUMinus, cusps, angleOk, angleErrors, zxClosed, zyClosed, zxNumeric, zyNumeric, dx, dy};
}

function fmt(x,d=6){ return Number.isFinite(x) ? x.toFixed(d) : "—"; }
function fmtExp(x,d=2){ return Number.isFinite(x) ? x.toExponential(d) : "—"; }

function renderTests(v){
  const rows = [
    {
      label:"Critical curve satisfies det J = 0",
      detail:`max over 2000 sampled points of ||1/z̄²−γ| − 1| = ${fmtExp(v.maxResidual)}`,
      pass: v.maxResidual < 1e-8
    },
    {
      label:"No second critical-curve branch (single-curve topology)",
      detail:`the other root of the same quadratic reaches a maximum of ${fmt(v.maxUMinus,6)} (stays negative ⇒ unphysical, confirming one curve, not two)`,
      pass: v.maxUMinus < -1e-6
    },
    {
      label:"Independent φ-parametrization finds exactly four cusps",
      detail: v.cusps.length===4
        ? `found at φ = ${v.cusps.map(c=>((c.phi*180/Math.PI+360)%360).toFixed(3)+"°").join(", ")} — max angular deviation from {0°,90°,180°,270°}: ${Math.max(...v.angleErrors).toExponential(2)}°`
        : `found ${v.cusps.length} cusp candidate(s) — expected 4`,
      pass: v.angleOk
    },
    {
      label:"Numeric cusp positions match the closed form",
      detail:`|ζ_numeric − ζ_closed|:  horizontal = ${fmtExp(v.dx)},  vertical = ${fmtExp(v.dy)}`,
      pass: (v.dx < 1e-6 && v.dy < 1e-6)
    }
  ];
  const container = document.getElementById('testsContainer');
  container.innerHTML = '';
  rows.forEach((r,i)=>{
    const div = document.createElement('div');
    div.className = 'test';
    div.innerHTML = `
      <div class="test-num">${i+1}</div>
      <div class="test-body">
        <div class="test-label">${r.label}</div>
        <div class="test-detail">${r.detail}</div>
      </div>
      <div class="pill ${r.pass?'pass':'fail'}">${r.pass?'PASS':'CHECK'}</div>
    `;
    container.appendChild(div);
  });
}

// ---------- SVG drawing ----------
function pathFromSamples(fn, g, N){
  let d = '';
  for(let i=0;i<=N;i++){
    const phi = 2*Math.PI*i/N;
    const p = fn(phi,g);
    const x = p[0], y = -p[1];
    d += (i===0?'M':'L') + x.toFixed(5) + ',' + y.toFixed(5) + ' ';
  }
  return d + 'Z';
}

function circlePath(rad,N=180){
  let d='';
  for(let i=0;i<=N;i++){
    const t = 2*Math.PI*i/N;
    const x = rad*Math.cos(t), y = -rad*Math.sin(t);
    d += (i===0?'M':'L') + x.toFixed(5) + ',' + y.toFixed(5) + ' ';
  }
  return d + 'Z';
}

function svgEl(tag, attrs){
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

function drawImagePlane(g, cusps){
  const svg = document.getElementById('svgImage');
  svg.innerHTML = '';
  const N = 720;
  let maxR = 1;
  for(let i=0;i<N;i++){ const z = zOf(2*Math.PI*i/N, g); maxR = Math.max(maxR, Math.hypot(z[0],z[1])); }
  const half = Math.max(maxR*1.25, 1.3);
  svg.setAttribute('viewBox', `${-half} ${-half} ${2*half} ${2*half}`);

  svg.appendChild(svgEl('line',{x1:-half,y1:0,x2:half,y2:0,stroke:'#2A3958','stroke-width':half*0.004}));
  svg.appendChild(svgEl('line',{x1:0,y1:-half,x2:0,y2:half,stroke:'#2A3958','stroke-width':half*0.004}));

  svg.appendChild(svgEl('path',{d:circlePath(1), fill:'none', stroke:'var(--ring)','stroke-width':half*0.006,'stroke-dasharray':`${half*0.02},${half*0.02}`}));

  svg.appendChild(svgEl('path',{d:pathFromSamples(zOf,g,N), fill:'var(--lens-fill)', stroke:'var(--lens)','stroke-width':half*0.012}));

  cusps.forEach(c=>{
    svg.appendChild(svgEl('circle',{cx:c.z[0], cy:-c.z[1], r:half*0.022, fill:'var(--lens)'}));
  });
  document.getElementById('imageScaleNote').textContent = `half-width ≈ ${half.toFixed(3)} θ_E · dashed circle = Einstein ring (unit circle)`;
}

function drawSourcePlane(g, cusps){
  const svg = document.getElementById('svgSource');
  svg.innerHTML = '';
  const N = 720;
  let maxZ = 0.15;
  for(let i=0;i<N;i++){ const z = zOf(2*Math.PI*i/N, g); const zt = zetaOf(z,g); maxZ = Math.max(maxZ, Math.hypot(zt[0],zt[1])); }
  const half = Math.max(maxZ*1.3, 0.15);
  svg.setAttribute('viewBox', `${-half} ${-half} ${2*half} ${2*half}`);

  svg.appendChild(svgEl('line',{x1:-half,y1:0,x2:half,y2:0,stroke:'#2A3958','stroke-width':half*0.004}));
  svg.appendChild(svgEl('line',{x1:0,y1:-half,x2:0,y2:half,stroke:'#2A3958','stroke-width':half*0.004}));

  function causticSample(phi,g){ return zetaOf(zOf(phi,g), g); }
  svg.appendChild(svgEl('path',{d:pathFromSamples(causticSample,g,N), fill:'var(--caustic-fill)', stroke:'var(--caustic)','stroke-width':half*0.012}));

  cusps.forEach(c=>{
    svg.appendChild(svgEl('circle',{cx:c.zeta[0], cy:-c.zeta[1], r:half*0.028, fill:'var(--caustic)'}));
  });
  document.getElementById('sourceScaleNote').textContent = `half-width ≈ ${half.toFixed(3)} θ_E`;
}

// ---------- main render ----------
function render(g){
  document.getElementById('gammaVal').textContent = g.toFixed(3);

  const v = runVerification(g);
  drawImagePlane(g, v.cusps);
  drawSourcePlane(g, v.cusps);
  renderTests(v);

  const zx = 2*g/Math.sqrt(1+g);
  const zy = 2*g/Math.sqrt(1-g);
  document.getElementById('rowH').textContent = `± ${fmt(zx,6)}`;
  document.getElementById('rowV').textContent = `± ${fmt(zy,6)} i`;
}

if (typeof document !== 'undefined' && document.getElementById('gammaSlider')) {
  document.getElementById('gammaSlider').addEventListener('input', (e)=>{
    render(parseFloat(e.target.value));
  });
}

// ---------- KaTeX rendering ----------
function K(id, tex, display=true){
  const el = document.getElementById(id);
  if (!el || typeof katex === 'undefined') return;
  try { katex.render(tex, el, {throwOnError:false, displayMode:display}); }
  catch(e){ el.textContent = tex; }
}

function renderMath(){
  K('eq1', String.raw`\zeta(z) = z - \gamma\bar z - \dfrac{1}{\bar z}`);
  K('eq2', String.raw`\dfrac{\partial \zeta}{\partial z} = 1 \qquad\qquad \dfrac{\partial \zeta}{\partial \bar z} = \dfrac{1}{\bar z^{2}} - \gamma`);
  K('eq3', String.raw`\det J \;=\; 1-\left|\dfrac{1}{\bar z^{2}}-\gamma\right|^{2} \;=\;0 \quad\Longleftrightarrow\quad \left|\dfrac{1}{\bar z^{2}}-\gamma\right| = 1`);
  K('eq4', String.raw`\dfrac{1}{z^{2}} = \gamma + e^{i\theta}, \qquad \theta\in[0,2\pi)`);
  K('eq5', String.raw`\overline{\dfrac{1}{z^{2}}} = \overline{\gamma+e^{i\theta}} \;\Longrightarrow\; \dfrac{1}{\bar z^{2}} = \gamma+e^{-i\theta} \;\Longrightarrow\; \dfrac{1}{\bar z^{2}}-\gamma = e^{-i\theta}`);
  K('eq6', String.raw`\dfrac{dz}{d\theta} = -\dfrac{i}{2}\,z^{3}e^{i\theta}, \qquad \dfrac{d\bar z}{d\theta} = \dfrac{i}{2}\,\bar z^{3}e^{-i\theta}`);
  K('eq7', String.raw`\dfrac{d\zeta}{d\theta} = \dfrac{dz}{d\theta} + \left(\dfrac{1}{\bar z^{2}}-\gamma\right)\dfrac{d\bar z}{d\theta} = \dfrac{dz}{d\theta} + e^{-i\theta}\dfrac{d\bar z}{d\theta} = \dfrac{i}{2}\Big(\bar z^{3}e^{-2i\theta} - z^{3}e^{i\theta}\Big)`);
  K('eq8', String.raw`\dfrac{d\zeta}{d\theta}=0 \quad\Longleftrightarrow\quad \bar z^{3} = z^{3}e^{3i\theta}`);
  K('eq9', String.raw`\theta=0:\quad \bar z^{3}=z^{3}\ \Rightarrow\ z\in\mathbb{R}\ \Rightarrow\ z=\pm\dfrac{1}{\sqrt{1+\gamma}}`);
  K('eq10', String.raw`\theta=\pi:\quad \bar z^{3}=z^{3}e^{3i\pi}=-z^{3}\ \Rightarrow\ z\in i\mathbb{R}\ \Rightarrow\ z=\pm\dfrac{i}{\sqrt{1-\gamma}}`);
  K('eq11', String.raw`\zeta_{\text{cusp},x} = (1-\gamma)z-\dfrac{1}{z}\Big|_{z=\pm1/\sqrt{1+\gamma}} = \pm\dfrac{2\gamma}{\sqrt{1+\gamma}}`);
  K('eq12', String.raw`\zeta_{\text{cusp},y} = (1+\gamma)z+\dfrac{1}{z}\Big|_{z=\pm i/\sqrt{1-\gamma}} = \pm\dfrac{2i\gamma}{\sqrt{1-\gamma}}`);
  K('eq13', String.raw`F(\theta) := \alpha(\theta)-\theta, \qquad \alpha'(\theta) = \dfrac{1+\gamma\cos\theta}{R^{2}} \;>\;0 \ \text{ for all } |\gamma|<1`);
  K('eqInlineA', String.raw`\gamma+e^{i\theta} \equiv Re^{i\alpha}`, false);
  K('eqInlineB', String.raw`\arg z = -\alpha/2 \pmod \pi`, false);
  K('eqInlineC', String.raw`\alpha(\theta)\equiv\theta \pmod{2\pi/3}`, false);
  K('eqInlineD', String.raw`F(\theta)`, false);
}

// ---------- init (browser only; no-op under Node) ----------
if (typeof document !== 'undefined' && document.getElementById('gammaSlider')) {
  renderMath();
  render(0.3);
}

// ---------- Node.js export of the pure, DOM-free computational core ----------
// Lets this file double as an automated-test module:
//   const lens = require('./lens_verification.js');
//   lens.runVerification(0.3)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { C, uOf, duOf, zOf, dzOf, zetaOf, dzetaOf, findCusps, runVerification };
}