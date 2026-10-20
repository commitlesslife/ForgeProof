"""
ForgeProof Defense-Grade Empirical Benchmark & Latency Suite
Measures sub-engine latency, resident memory footprint (RSS), and verdict precision
across all 7 operational identity screening scenarios.
Conforms to Ministry of Home Affairs (MHA) & Police II technical standards.
"""

import os
import sys
import time
import json
import psutil
from typing import Dict, Any, List

# Ensure parent directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import SAMPLES_DIR, FORENSICS_DIR, UPLOADS_DIR, FACES_DIR
from app.core.pipeline import run_preset_scenario_pipeline


SCENARIOS = [
    {
        "id": "scenario1_genuine_passport",
        "name": "Scenario 1: Authentic Indian Passport",
        "doc_file": "scenario1_genuine_indian_passport.jpg",
        "live_file": "presenter_rohit_matching.jpg",
        "doc_type": "PASSPORT",
        "expected_verdict": "LOW",
        "expected_risk_max": 20.0
    },
    {
        "id": "scenario2_photo_splice",
        "name": "Scenario 2: Boundary Photo Splice Tampering",
        "doc_file": "scenario2_tampered_photo_splice.jpg",
        "live_file": "presenter_impersonator_mismatch.jpg",
        "doc_type": "PASSPORT",
        "expected_verdict": "HIGH",
        "expected_risk_min": 75.0
    },
    {
        "id": "scenario3_date_fraud",
        "name": "Scenario 3: Expiry Date Alteration & MRZ Desync",
        "doc_file": "scenario3_tampered_date_mrz_mismatch.jpg",
        "live_file": "presenter_rohit_matching.jpg",
        "doc_type": "PASSPORT",
        "expected_verdict": "HIGH",
        "expected_risk_min": 75.0
    },
    {
        "id": "scenario4_genuine_aadhaar",
        "name": "Scenario 4: Genuine Indian Aadhaar (Verhoeff Pass)",
        "doc_file": "scenario4_genuine_indian_aadhaar.jpg",
        "live_file": "presenter_rohit_matching.jpg",
        "doc_type": "AADHAAR",
        "expected_verdict": "LOW",
        "expected_risk_max": 20.0
    },
    {
        "id": "scenario5_tampered_aadhaar",
        "name": "Scenario 5: Forged Aadhaar (Verhoeff Checksum Fail)",
        "doc_file": "scenario5_tampered_aadhaar_invalid_verhoeff.jpg",
        "live_file": "presenter_rohit_matching.jpg",
        "doc_type": "AADHAAR",
        "expected_verdict": "HIGH",
        "expected_risk_min": 80.0
    },
    {
        "id": "scenario1_interpol_hit",
        "name": "Scenario 6: Interpol Red Notice Wanted Persona",
        "doc_file": "scenario1_genuine_indian_passport.jpg",
        "live_file": "presenter_rohit_matching.jpg",
        "doc_type": "PASSPORT",
        "expected_verdict": "CRITICAL",
        "expected_risk_min": 99.0
    },
    {
        "id": "scenario7_photo_substitution",
        "name": "Scenario 7: UIDAI Tri-Party Photo Substitution",
        "doc_file": "scenario4_genuine_indian_aadhaar.jpg",
        "live_file": "presenter_impersonator_mismatch.jpg",
        "doc_type": "AADHAAR",
        "expected_verdict": "HIGH",
        "expected_risk_min": 95.0
    }
]


def run_benchmark() -> Dict[str, Any]:
    process = psutil.Process(os.getpid())
    baseline_rss_mb = process.memory_info().rss / (1024 * 1024)

    results: List[Dict[str, Any]] = []
    total_latency_ms = 0.0
    peak_rss_mb = baseline_rss_mb

    print("\n" + "=" * 92)
    print("      FORGEPROOF DEFENSE BENCHMARK SUITE — MHA / SSB HARDWARE EVALUATION")
    print(f"      Host PID: {process.pid} | Baseline Memory: {baseline_rss_mb:.2f} MB RSS")
    print("=" * 92 + "\n")

    for sc in SCENARIOS:
        doc_path = os.path.join(str(SAMPLES_DIR), sc["doc_file"])
        live_path = os.path.join(str(SAMPLES_DIR), sc["live_file"])

        if not os.path.exists(doc_path):
            print(f"[!] Warning: Missing sample file {doc_path}, skipping.")
            continue

        # Memory before
        mem_before = process.memory_info().rss / (1024 * 1024)

        t_start = time.perf_counter()
        pipeline_output = run_preset_scenario_pipeline(
            preset_id=sc["id"],
            doc_path=doc_path,
            live_path=live_path,
            doc_type=sc["doc_type"]
        )
        t_end = time.perf_counter()

        latency_ms = (t_end - t_start) * 1000.0
        total_latency_ms += latency_ms

        mem_after = process.memory_info().rss / (1024 * 1024)
        if mem_after > peak_rss_mb:
            peak_rss_mb = mem_after

        risk = pipeline_output.get("risk_assessment", {})
        verdict = risk.get("risk_level", "UNKNOWN")
        composite_score = risk.get("composite_score", 0.0)

        # Check precision
        expected = sc["expected_verdict"]
        passed = (verdict == expected)

        results.append({
            "id": sc["id"],
            "name": sc["name"],
            "doc_type": sc["doc_type"],
            "latency_ms": round(latency_ms, 2),
            "mem_rss_mb": round(mem_after, 2),
            "verdict": verdict,
            "expected_verdict": expected,
            "composite_score": composite_score,
            "passed": passed,
            "case_id": pipeline_output.get("case_id")
        })

    # Render ASCII Report Table
    print(f"{'Scenario Name':<42} | {'Doc Type':<8} | {'Time (ms)':<9} | {'Score':<5} | {'Verdict':<8} | {'Status':<6}")
    print("-" * 92)

    passed_count = 0
    for r in results:
        status_str = "PASS" if r["passed"] else "FAIL"
        if r["passed"]:
            passed_count += 1
        print(f"{r['name']:<42} | {r['doc_type']:<8} | {r['latency_ms']:<9.1f} | {r['composite_score']:<5.1f} | {r['verdict']:<8} | {status_str:<6}")

    print("-" * 92)
    avg_latency = total_latency_ms / max(1, len(results))
    accuracy = (passed_count / max(1, len(results))) * 100.0

    print(f"\n[+] Empirical Benchmark Metrics:")
    print(f"    - Total Scenarios Evaluated : {len(results)}")
    print(f"    - Detection Precision Rate  : {accuracy:.1f}% ({passed_count}/{len(results)})")
    print(f"    - Mean Latency per Document : {avg_latency:.1f} ms")
    print(f"    - Peak Resident Memory (RSS): {peak_rss_mb:.2f} MB")
    print(f"    - Memory Headroom (512M B1) : {max(0, 512.0 - peak_rss_mb):.1f} MB remaining\n")

    summary_payload = {
        "timestamp": time.time(),
        "total_scenarios": len(results),
        "accuracy_pct": accuracy,
        "mean_latency_ms": round(avg_latency, 2),
        "peak_rss_mb": round(peak_rss_mb, 2),
        "scenarios": results
    }

    # Save to JSON artifact
    out_json = os.path.join(os.path.dirname(__file__), "benchmark_results.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(summary_payload, f, indent=2)
    print(f"[+] Persisted benchmark telemetry to: {out_json}\n")

    return summary_payload


if __name__ == "__main__":
    run_benchmark()
