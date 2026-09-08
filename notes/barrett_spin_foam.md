# Barrett spin foam and first-order action

Newton off. Not Sigma_ReS. Not S_q.

Axis C action (Barrett 1994):
J = sum_t |sigma^2|(g) (2 pi - sum_{sigma^4 > t} Theta).
On one 4-simplex: J_C = sum_{t=1}^{10} A_t (2 pi - Theta_t).
Regular unit 4-simplex fixture: Theta = arccos(1/4), A = sqrt(3)/4.
Areas do not uniquely reconstruct edge lengths.

Barrett-Crane 10j:
{10j} = integral_{SU(2)^5} prod dg_a prod_{a<b} chi_{j_ab}(g_a^{-1} g_b).
Dual vertex = 4-simplex, dual edge = tetra / BC intertwiner, dual face = triangle / simple j.
No 10j solver. No GPU. Face/edge amplitudes left unspecified.

Axis map: A = three 10j, B = degenerate saddles, C = classical J, D = Lorentzian 10j, E = reconstruction {A,n,X}.
