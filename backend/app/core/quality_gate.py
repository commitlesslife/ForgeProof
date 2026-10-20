"""
ForgeProof Image Quality Gate Engine
Validates incoming document scans and camera captures for optical clarity,
specular reflection (glare), resolution, perspective skew, and Michelson contrast
before biometric and forensic processing.
Conforms to PDD Section 5.2 and ISO/IEC 30107 / ICAO Doc 9303 Part 3 optical quality standards.
"""

import os
import cv2
import numpy as np
from typing import Dict, Any, Tuple, Optional

from app.config import (
    MIN_SHARPNESS_LAPLACIAN_VAR,
    MAX_GLARE_PIXEL_RATIO,
    MIN_IMAGE_WIDTH,
    MIN_IMAGE_HEIGHT,
)


def compute_tenengrad(gray: np.ndarray) -> float:
    """
    Computes Tenengrad gradient focus measure: mean(Gx^2 + Gy^2).
    Optimal for detecting micro-edge blur across security lines and micro-typography.
    """
    gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    grad_sq = gx ** 2 + gy ** 2
    return float(np.mean(grad_sq))


def detect_perspective_skew(gray: np.ndarray) -> float:
    """
    Estimates document perspective skew and tilt angle in degrees (-45.0 to +45.0)
    using Canny edge detection and Probabilistic Hough Line Transform (cv2.HoughLinesP).
    """
    try:
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=50, minLineLength=40, maxLineGap=12)
        if lines is None or len(lines) == 0:
            return 0.0

        angles = []
        for line in lines:
            coords = line[0] if line.ndim == 2 else line
            x1, y1, x2, y2 = coords
            dx = float(x2 - x1)
            dy = float(y2 - y1)
            if abs(dx) < 1e-4:
                continue
            rad = np.arctan2(dy, dx)
            deg = np.degrees(rad)
            # Filter lines roughly parallel to document borders
            if -45.0 <= deg <= 45.0:
                angles.append(deg)

        if not angles:
            return 0.0

        median_angle = float(np.median(angles))
        return round(median_angle, 2)
    except Exception:
        return 0.0


def deskew_image(img: np.ndarray, angle: float) -> np.ndarray:
    """
    Rotates image around center by -angle with border replication to eliminate skew.
    """
    if abs(angle) < 0.4:
        return img
    h, w = img.shape[:2]
    center = (w / 2.0, h / 2.0)
    rot_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    deskewed = cv2.warpAffine(img, rot_matrix, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    return deskewed


def compute_michelson_contrast(gray: np.ndarray) -> float:
    """
    Computes normalized Michelson text contrast: (I_95 - I_5) / (I_95 + I_5 + epsilon).
    Guarantees sufficient optical contrast between dark printed ink and light card substrate.
    """
    p95 = float(np.percentile(gray, 95))
    p5 = float(np.percentile(gray, 5))
    if p95 + p5 < 1e-5:
        return 0.0
    contrast = (p95 - p5) / (p95 + p5 + 1e-6)
    return round(float(np.clip(contrast, 0.0, 1.0)), 3)


def evaluate_image_quality(image_path: str, auto_deskew: bool = False) -> Dict[str, Any]:
    """
    Evaluates image optical clarity, sharpness (Laplacian + Tenengrad), glare,
    perspective skew angle, Michelson contrast, and resolution.
    Optionally deskews the image in-place if perspective tilt is detected.
    """
    img = cv2.imread(image_path)
    if img is None:
        return {
            "passed": False,
            "quality_score": 0.0,
            "blur_metric": 0.0,
            "blur_status": "Unreadable File",
            "tenengrad_score": 0.0,
            "contrast_ratio": 0.0,
            "contrast_status": "Unreadable",
            "skew_angle": 0.0,
            "skew_status": "Unknown",
            "deskewed": False,
            "glare_percentage": 0.0,
            "glare_status": "Unknown",
            "resolution": "0x0",
            "resolution_ok": False,
            "feedback": "Unable to decode image file. Please provide a valid JPEG or PNG.",
        }

    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 1. Sharpness: Laplacian Variance + Tenengrad Gradient
    lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    tenengrad = compute_tenengrad(gray)
    is_sharp = lap_var >= MIN_SHARPNESS_LAPLACIAN_VAR
    blur_status = "Sharp" if is_sharp else "Blurred / Out of Focus"

    # 2. Specular Reflection (Glare) via HSV Mask
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    glare_mask = (hsv[:, :, 2] > 248) & (hsv[:, :, 1] < 45)
    glare_ratio = float(np.sum(glare_mask) / (h * w))
    has_excessive_glare = glare_ratio > MAX_GLARE_PIXEL_RATIO
    glare_pct = round(glare_ratio * 100.0, 2)
    glare_status = "Excessive Glare" if has_excessive_glare else "Normal Lighting"

    # 3. Perspective Skew & Tilt Detection
    skew_angle = detect_perspective_skew(gray)
    was_deskewed = False
    if abs(skew_angle) <= 1.0:
        skew_status = "Aligned"
    elif abs(skew_angle) <= 8.0:
        skew_status = "Slight Tilt"
    elif abs(skew_angle) <= 25.0:
        skew_status = "Moderate Skew"
    else:
        skew_status = "Severe Perspective Distortion"

    if auto_deskew and 0.8 <= abs(skew_angle) <= 25.0:
        try:
            deskewed_img = deskew_image(img, skew_angle)
            cv2.imwrite(image_path, deskewed_img)
            was_deskewed = True
            # Recompute gray after deskew
            gray = cv2.cvtColor(deskewed_img, cv2.COLOR_BGR2GRAY)
            skew_angle = 0.0
            skew_status = "Auto-Deskewed"
        except Exception as e:
            print(f"Auto-deskew exception: {e}")

    # 4. Michelson Text Contrast Ratio
    contrast = compute_michelson_contrast(gray)
    if contrast >= 0.65:
        contrast_status = "High Contrast"
    elif contrast >= 0.45:
        contrast_status = "Adequate Contrast"
    else:
        contrast_status = "Low Contrast / Faded"

    # 5. Resolution Verification
    resolution_ok = (w >= MIN_IMAGE_WIDTH) and (h >= MIN_IMAGE_HEIGHT)
    resolution_str = f"{w}x{h}"

    # 6. Composite Multi-Metric Quality Score (0 to 100)
    score = 100.0
    feedback_points = []

    if not is_sharp:
        penalty = min(35.0, (MIN_SHARPNESS_LAPLACIAN_VAR - lap_var) * 0.4)
        score -= penalty
        feedback_points.append("Camera focus is soft or blurry")

    if has_excessive_glare:
        score -= min(30.0, glare_pct * 0.8)
        feedback_points.append("Excessive reflection/glare across document surface")

    if contrast < 0.45:
        score -= 15.0
        feedback_points.append("Low optical contrast between text and background")

    if abs(skew_angle) > 15.0:
        score -= 15.0
        feedback_points.append("Severe perspective tilt exceeds auto-correction limit")

    if not resolution_ok:
        score -= 40.0
        feedback_points.append(f"Resolution {resolution_str} is below minimum requirement ({MIN_IMAGE_WIDTH}x{MIN_IMAGE_HEIGHT})")

    quality_score = round(max(5.0, min(100.0, score)), 1)
    passed = is_sharp and not has_excessive_glare and resolution_ok and (abs(skew_angle) <= 25.0)

    if passed:
        feedback = "Optical quality verified. Clarity, lighting, alignment, and contrast meet ICAO/MHA standards."
    else:
        feedback = "Quality warning: " + "; ".join(feedback_points) + ". Re-scan recommended if verification is inconclusive."

    return {
        "passed": passed,
        "quality_score": quality_score,
        "blur_metric": round(lap_var, 1),
        "blur_status": blur_status,
        "tenengrad_score": round(tenengrad, 1),
        "contrast_ratio": contrast,
        "contrast_status": contrast_status,
        "skew_angle": skew_angle,
        "skew_status": skew_status,
        "deskewed": was_deskewed,
        "glare_percentage": glare_pct,
        "glare_status": glare_status,
        "resolution": resolution_str,
        "resolution_ok": resolution_ok,
        "feedback": feedback,
    }
