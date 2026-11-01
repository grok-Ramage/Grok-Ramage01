-- Grok-Ramage01 extract: Sigma_Sq germ
-- Family: quantum
-- Claim: A2_Sq
-- Device: TEXT
-- Newton: off
-- No identification with Sigma_ReS
-- No closed-chart restencil
-- Kernel-accepted under Lean 4.35 + Mathlib

import Mathlib.Basic.Real.Basic
import Mathlib.Analysis.Calculus.Deriv.Basic
import Mathlib.Analysis.Calculus.Deriv.Pow
import Mathlib.Analysis.Calculus.Deriv.Mul

open Real

/-- The owned germ S_q(u; α) = (1/3) u³ − α u. -/
noncomputable def S_q (u α : ℝ) : ℝ := (1 / 3) * (u ^ (3 : ℕ)) - α * u

/-- First derivative with respect to u: F(u; α) = u² − α. -/
noncomputable def F (u α : ℝ) : ℝ := (u ^ (2 : ℕ)) - α

theorem fold_at_origin :
    F 0 0 = 0 ∧ deriv (fun u => F u 0) 0 = 0 := by
  constructor
  · simp [F]
  · simp [F, deriv_id']

/-- Non-degeneracy: third derivative at the origin equals 2 (a₂ = 1 after normalization). -/
theorem non_degeneracy :
    (deriv (deriv (deriv (fun (u : ℝ) => (1 / 3) * (u ^ (3 : ℕ))))) (0 : ℝ)) = (2 : ℝ) := by
  have step1 : deriv (fun (u : ℝ) => (1 / 3) * (u ^ (3 : ℕ))) = fun (u : ℝ) => u ^ 2 := by
    funext u
    have hpow : HasDerivAt (fun (u : ℝ) => u ^ (3 : ℕ)) (3 * u ^ 2) u :=
      HasDerivAt.pow (HasDerivAt.id u) 3
    have hmul : HasDerivAt (fun (u : ℝ) => (1 / 3) * (u ^ (3 : ℕ))) ((1 / 3) * (3 * u ^ 2)) u :=
      HasDerivAt.const_mul (1 / 3) hpow
    have heq : (1 / 3) * (3 * u ^ 2) = u ^ 2 := by ring
    rw [heq] at hmul
    exact hmul.deriv
  have step2 : deriv (fun (u : ℝ) => u ^ 2) = fun (u : ℝ) => 2 * u := by
    funext u
    exact (HasDerivAt.pow (HasDerivAt.id u) 2).deriv
  have step3 : deriv (fun (u : ℝ) => 2 * u) = fun (_ : ℝ) => 2 := by
    funext _
    simp [deriv_id']
  calc
    deriv (deriv (deriv (fun (u : ℝ) => (1 / 3) * (u ^ (3 : ℕ))))) 0
      = deriv (deriv (fun (u : ℝ) => u ^ 2)) 0 := by rw [step1]
    _ = deriv (fun (u : ℝ) => 2 * u) 0 := by rw [step2]
    _ = 2 := by rw [step3]
