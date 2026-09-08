import unittest
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.admit import admit
from src.sq_germ import SqGerm, sigma_sq


class SqGermTests(unittest.TestCase):
    def setUp(self):
        self.g = SqGerm()

    def test_sigma_point(self):
        p = self.g.point(0.0, 0.0)
        self.assertEqual(p.F, 0.0)
        self.assertEqual(p.H, 0.0)
        self.assertEqual(p.a2, 1.0)
        self.assertTrue(p.on_sigma)
        self.assertTrue(sigma_sq.on_sigma)

    def test_not_sigma_off_origin(self):
        self.assertFalse(self.g.point(1.0, 1.0).on_sigma)
        self.assertEqual(self.g.F(1.0, 1.0), 0.0)
        self.assertNotEqual(self.g.H(1.0), 0.0)

    def test_potential_value(self):
        self.assertEqual(self.g.S(0.0, 0.0), 0.0)
        self.assertEqual(self.g.S(3.0, 0.0), 9.0)


class AdmitTests(unittest.TestCase):
    def test_legal(self):
        v = admit("S_q fold at alpha=0, u=0; a2=1")
        self.assertTrue(v.admit)
        self.assertEqual(v.gate, "ADMIT")

    def test_mixed_tokens(self):
        v = admit("a1 vanishes where q_c is the cutoff")
        self.assertFalse(v.admit)
        self.assertEqual(v.gate, "G0")

    def test_transfer(self):
        v = admit("Sigma_Sq therefore Sigma_ReS")
        self.assertFalse(v.admit)
        self.assertEqual(v.gate, "G4")

    def test_fold_res_claim(self):
        v = admit("classify this ReS point", claim="fold_ReS", family="hunt")
        self.assertFalse(v.admit)
        self.assertEqual(v.gate, "G2")

    def test_gpu(self):
        v = admit("S_q fold at origin", device="GPU")
        self.assertFalse(v.admit)
        self.assertEqual(v.gate, "G5")


if __name__ == "__main__":
    unittest.main()
