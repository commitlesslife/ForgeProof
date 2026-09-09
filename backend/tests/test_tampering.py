"""
Unit tests for Forensic Tampering Detection Engine (ELA, boundary, noise, stamp, EXIF).
"""

import unittest
import numpy as np
import cv2
import tempfile
import os

from app.modules.tampering_engine import (
    compute_ela_heatmap,
    analyze_photo_boundary,
    analyze_noise_consistency,
    verify_stamp_integrity,
    inspect_metadata_forensics,
    run_comprehensive_forensics,
)


class TestTamperingEngine(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        
    def tearDown(self):
        for f in os.listdir(self.temp_dir):
            try:
                os.remove(os.path.join(self.temp_dir, f))
            except Exception:
                pass
        try:
            os.rmdir(self.temp_dir)
        except Exception:
            pass

    def test_ela_computation_and_heatmap(self):
        img_path = os.path.join(self.temp_dir, "doc.jpg")
        heatmap_path = os.path.join(self.temp_dir, "ela_out.jpg")

        # Create test document image
        img = np.full((400, 600, 3), 200, dtype=np.uint8)
        cv2.putText(img, "TEST PASSPORT", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
        cv2.imwrite(img_path, img)

        res = compute_ela_heatmap(img_path, heatmap_path)
        self.assertTrue(os.path.exists(heatmap_path))
        self.assertIn("tampering_score", res)
        self.assertIn("spike_ratio", res)

    def test_boundary_analysis(self):
        img_path = os.path.join(self.temp_dir, "doc.jpg")
        edge_path = os.path.join(self.temp_dir, "edge_out.jpg")

        img = np.full((400, 600, 3), 240, dtype=np.uint8)
        # Draw a synthetic pasted square with very high edge gradient
        img[80:260, 20:220] = 50
        cv2.imwrite(img_path, img)

        res = analyze_photo_boundary(img_path, edge_path)
        self.assertTrue(os.path.exists(edge_path))
        self.assertIn("boundary_score", res)
        self.assertIn("edge_variance", res)

    def test_noise_analysis(self):
        img_path = os.path.join(self.temp_dir, "noise_doc.jpg")
        img = np.random.randint(100, 200, (400, 600, 3), dtype=np.uint8)
        cv2.imwrite(img_path, img)

        res = analyze_noise_consistency(img_path)
        self.assertIn("noise_score", res)
        self.assertIn("noise_tampered", res)

    def test_comprehensive_forensics_pipeline(self):
        img_path = os.path.join(self.temp_dir, "master_doc.jpg")
        img = np.full((500, 700, 3), 220, dtype=np.uint8)
        cv2.imwrite(img_path, img)

        res = run_comprehensive_forensics(img_path, self.temp_dir, "CASE_TEST")
        self.assertIn("tampering_score", res)
        self.assertIn("is_tampered", res)
        self.assertIn("evidence_list", res)
        self.assertIn("ela_heatmap_url", res)


if __name__ == "__main__":
    unittest.main()
