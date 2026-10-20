"""
Unit tests for Image Quality Gate Engine (Laplacian, Tenengrad, Hough Skew, Auto-Deskew, Michelson Contrast).
"""

import unittest
import numpy as np
import cv2
import tempfile
import os

from app.core.quality_gate import (
    evaluate_image_quality,
    compute_tenengrad,
    detect_perspective_skew,
    deskew_image,
    compute_michelson_contrast
)


class TestQualityGate(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        
    def tearDown(self):
        for f in os.listdir(self.temp_dir):
            os.remove(os.path.join(self.temp_dir, f))
        os.rmdir(self.temp_dir)

    def test_sharp_image_passes(self):
        # Create a sharp image with high-frequency checkerboard pattern
        img = np.zeros((600, 800, 3), dtype=np.uint8)
        img[::20, :] = 255
        img[:, ::20] = 255
        path = os.path.join(self.temp_dir, "sharp.jpg")
        cv2.imwrite(path, img)

        res = evaluate_image_quality(path)
        self.assertTrue(res["passed"])
        self.assertEqual(res["blur_status"], "Sharp")
        self.assertGreater(res["quality_score"], 80.0)
        self.assertIn("tenengrad_score", res)
        self.assertIn("contrast_ratio", res)
        self.assertIn("skew_angle", res)

    def test_blurred_image_flagged(self):
        # Create a blurred image with Gaussian blur
        img = np.random.randint(50, 200, (600, 800, 3), dtype=np.uint8)
        blurred = cv2.GaussianBlur(img, (31, 31), 10)
        path = os.path.join(self.temp_dir, "blurred.jpg")
        cv2.imwrite(path, blurred)

        res = evaluate_image_quality(path)
        self.assertEqual(res["blur_status"], "Blurred / Out of Focus")

    def test_low_resolution_flagged(self):
        # Create small 200x200 image
        img = np.zeros((200, 200, 3), dtype=np.uint8)
        path = os.path.join(self.temp_dir, "small.jpg")
        cv2.imwrite(path, img)

        res = evaluate_image_quality(path)
        self.assertFalse(res["resolution_ok"])
        self.assertFalse(res["passed"])

    def test_michelson_contrast_calculation(self):
        # High contrast: black text on white paper
        high_contrast = np.ones((100, 100), dtype=np.uint8) * 240
        high_contrast[40:60, :] = 15
        contrast_high = compute_michelson_contrast(high_contrast)
        self.assertGreaterEqual(contrast_high, 0.70)

        # Low contrast: gray text on light gray paper
        low_contrast = np.ones((100, 100), dtype=np.uint8) * 160
        low_contrast[40:60, :] = 130
        contrast_low = compute_michelson_contrast(low_contrast)
        self.assertLess(contrast_low, 0.35)

    def test_skew_detection_and_deskew(self):
        # Create an image with horizontal text-like lines
        img = np.ones((400, 400), dtype=np.uint8) * 255
        for y in range(50, 350, 25):
            cv2.line(img, (50, y), (350, y), 0, 3)

        # Rotate by 10 degrees
        matrix = cv2.getRotationMatrix2D((200, 200), -10, 1.0)
        tilted = cv2.warpAffine(img, matrix, (400, 400), borderMode=cv2.BORDER_REPLICATE)

        tilted_color = cv2.cvtColor(tilted, cv2.COLOR_GRAY2BGR)
        tilted_path = os.path.join(self.temp_dir, "tilted.jpg")
        cv2.imwrite(tilted_path, tilted_color)

        # Evaluate with auto_deskew=True
        res = evaluate_image_quality(tilted_path, auto_deskew=True)
        self.assertTrue(res["deskewed"])
        self.assertEqual(res["skew_status"], "Auto-Deskewed")


if __name__ == "__main__":
    unittest.main()
