"""
Unit tests for Tri-Party Biometric Cross-Verification and CMFD Forensic Engine.
"""

import os
import unittest
import numpy as np
import cv2
import tempfile
from app.modules.tampering_engine import detect_copy_move_forgery
from app.modules.face_engine import cross_verify_qr_portrait
from app.modules.risk_engine import compute_composite_risk


class TestTripartyAndCMFD(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_cmfd_overlay_generation(self):
        """Test that CMFD executes and saves visual forensic overlay file."""
        # Create a synthetic image with repeated patches
        img = np.ones((300, 300, 3), dtype=np.uint8) * 200
        # Draw distinctive pattern
        for y in range(20, 60, 5):
            cv2.line(img, (20, y), (80, y), (0, 0, 0), 1)
        # Duplicate the pattern elsewhere (copy-move simulation)
        img[150:190, 150:210] = img[20:60, 20:80]

        img_path = os.path.join(self.temp_dir.name, "doc_cloned.jpg")
        cv2.imwrite(img_path, img)

        overlay_path = os.path.join(self.temp_dir.name, "cmfd_overlay.jpg")
        result = detect_copy_move_forgery(img_path, output_cmfd_path=overlay_path)

        self.assertIn("cmfd_detected", result)
        self.assertIn("cloned_pairs_count", result)
        self.assertTrue(os.path.exists(overlay_path))

    def test_triparty_cross_verification_missing_qr_portrait(self):
        """Test graceful fallback when no QR portrait path is provided."""
        face_res = {"success": True, "match_score": 90.0}
        result = cross_verify_qr_portrait(face_res, qr_photo_path="")
        self.assertFalse(result.get("has_qr_face"))

    def test_risk_engine_photo_substitution_floor(self):
        """Test that photo substitution elevates composite risk to at least 95.0."""
        validation_res = {
            "indian_id": {"is_valid": True, "doc_type": "AADHAAR"},
            "qr_code": {"detected": True, "tampering_detected": False}
        }
        tampering_res = {"tampering_score": 10.0, "evidence_list": []}
        face_res = {
            "success": True,
            "match_score": 85.0,
            "face_risk": 15.0,
            "triparty": {
                "has_qr_face": True,
                "photo_substitution_detected": True,
                "doc_vs_qr_match": False
            }
        }
        meta_res = {"metadata_risk": 0.0, "flags": []}

        risk = compute_composite_risk(validation_res, tampering_res, face_res, meta_res)
        self.assertGreaterEqual(risk["composite_score"], 95.0)
        self.assertEqual(risk["risk_level"], "HIGH")
        
        # Check that photo substitution evidence is recorded
        found_subst_evidence = any(
            "Photo Substitution" in ev.get("title", "") for ev in risk["evidence_items"]
        )
        self.assertTrue(found_subst_evidence)

    def test_scenario7_preset_execution(self):
        """Test preset execution for scenario7_photo_substitution."""
        from app.core.pipeline import run_preset_scenario_pipeline
        from app.config import SAMPLES_DIR

        doc_sample = os.path.join(str(SAMPLES_DIR), "scenario4_genuine_indian_aadhaar.jpg")
        live_sample = os.path.join(str(SAMPLES_DIR), "presenter_impersonator_mismatch.jpg")

        if os.path.exists(doc_sample) and os.path.exists(live_sample):
            result = run_preset_scenario_pipeline(
                preset_id="scenario7_photo_substitution",
                doc_path=doc_sample,
                live_path=live_sample,
                doc_type="AADHAAR"
            )
            self.assertEqual(result["risk_assessment"]["risk_level"], "HIGH")
            self.assertGreaterEqual(result["risk_assessment"]["composite_score"], 95.0)
            self.assertTrue(result["face_match"]["triparty"]["photo_substitution_detected"])
            self.assertFalse(result["face_match"]["triparty"]["doc_vs_qr_match"])
