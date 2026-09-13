import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "tools" / "desk_build"))

from src.admit import admit
from hardware import probe
from legal_lattice import scan


class DeskBuildTests(unittest.TestCase):
    def test_g5_still_refuses_gpu_classify(self):
        v = admit("S_q fold at origin", device="GPU")
        self.assertFalse(v.admit)
        self.assertEqual(v.gate, "G5")

    def test_cpu_still_admits(self):
        v = admit("S_q fold at origin", device="CPU")
        self.assertTrue(v.admit)

    def test_lattice_counts(self):
        data = scan()
        self.assertEqual(data["device"], "CPU")
        self.assertEqual(data["cusp"], 201)
        self.assertEqual(data["count"], 5635)
        self.assertEqual(data["fold"], 5434)
        self.assertLess(data["semicubical_residual"], 1e-12)
        self.assertLess(data["F_residual"], 1e-12)

    def test_hardware_split(self):
        hw = probe()
        self.assertEqual(hw["classify_device"], "CPU")
        self.assertIn(hw["display_device"], {"GPU", "CPU"})
        self.assertEqual(hw["g5"], "GPU admit remains REFUSE")


if __name__ == "__main__":
    unittest.main()
