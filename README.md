# ForgeProof — AI-Based Fake Identity & Document Screening System
### SIH 2026 Edition (Smart India Hackathon)
**Border Checkpoint Identity & Travel Document Verification System**

---

## 🚀 Overview

**ForgeProof** is a multi-modal, explainable AI document verification platform engineered for border security checkpoints (such as international airports and land border crossings). It replaces minutes of manual inspection with **sub-2-second, evidence-backed automated screening** to catch sophisticated digital and physical forgeries.

Designed according to the **SIH 2026 Project Definition Document (PDD-SIH26 v2)**, ForgeProof operates across 5 integrated architectural layers:

1. **Layer 1: Ingestion & Quality Gate**: Optical validation for blur (Laplacian variance), specular reflection/glare, and resolution normalization.
2. **Layer 2: AI Core Processing Modules**:
   - **Module 1 (MRZ Engine)**: Strict **ICAO Doc 9303** standard parser (TD1, TD2, TD3) with cyclical **7-3-1 weighting check digit** verification.
   - **Module 2 (Validation Engine)**: Indian ID verification (UIDAI **Verhoeff Dihedral $D_5$ algorithm** for 12-digit Aadhaar, 10-character PAN entity/surname consistency, MoRTH Driving Licence structure) and Visual Zone (VIZ) vs. MRZ cross-consistency checking.
   - **Module 3 (Forensic Tampering Engine)**: Error Level Analysis (**ELA**) with thermal JPEG compression difference mapping, photo perimeter Sobel edge discontinuity/cut seam analysis, background noise variance inspection, and official immigration stamp circularity evaluation.
   - **Module 4 (Biometric Face Verification)**: 1:1 face embedding extraction via 128-dimensional deep neural metric models (`dlib` ResNet), Euclidean distance & calibrated similarity percentage, and FFT texture-based presentation attack/anti-spoofing detection.
3. **Layer 3: Risk Scoring & Explainability Engine**: Calibrated composite risk scoring ($0-100$, Low/Medium/High) backed by itemized, plain-English evidence cards.
4. **Layer 4: Data & Cryptographic Audit Ledger**: Immutable SHA-256 hash-chained audit log guaranteeing non-repudiation of every screening event and officer decision.
5. **Layer 5: Officer Review Station**: High-tech defense terminal UI (React + Vite + Tailwind CSS) with toggleable forensic heatmaps, side-by-side biometric comparator, live laptop webcam verification, and one-click export of an official Border Incident Dossier.

---

## ⚡ Quick Start (1-Click Run)

To run the complete system on Windows:
```bash
# Double click or run:
run_demo.bat
```

Or start backend and frontend manually:
```bash
# Terminal 1: Backend
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.
API Swagger Documentation is live at **[http://localhost:8000/docs](http://localhost:8000/docs)**.

---

## 🎯 5-Minute Live Presentation Script for Judges

Use the **Demo Presets Toolbar** across the top of the terminal:

| Scenario | Click Preset Button | What Judges See | Key Technical Talking Point |
|---|---|---|---|
| **1. Genuine Indian Passport** | `Scenario 1: Genuine Indian Passport` | **LOW RISK (12.0/100, Emerald)**<br>All 4 ICAO check digits pass (`✓ 7-3-1 PASS`), 94.2% biometric face match, clean ELA. | "Our system validates ICAO Doc 9303 7-3-1 check digits offline and confirms 128-d deep facial embeddings." |
| **2. Photo Splice Attack** | `Scenario 2: Spliced Photo Replacement` | **HIGH RISK (86.0/100, Red Alert)**<br>Perimeter splice detected, ELA compression thermal spike. | "Click **ELA Heatmap** or **Spliced Edge Map** — point out the glowing thermal signature around the replaced portrait where foreign JPEG blocks were pasted." |
| **3. Date Fraud & Broken MRZ** | `Scenario 3: Date Fraud & MRZ Mismatch` | **HIGH RISK (79.5/100, Red Alert)**<br>Cross-Check Alert: Printed Expiry `09/01/2036` vs MRZ `09/01/2031`. | "Fraudsters often change printed numbers but cannot forge the mathematical ICAO 7-3-1 check digit without detection." |
| **4. Genuine Indian Aadhaar** | `Scenario 4: Genuine Indian Aadhaar` | **LOW RISK (8.5/100, Emerald)**<br>UIDAI Verhoeff D5 Checksum: Valid. | "Aadhaar UID validation runs the exact Dihedral $D_5$ group algebraic permutation used by UIDAI." |
| **5. Tampered Aadhaar (Fake UID)** | `Scenario 5: Tampered Aadhaar` | **HIGH RISK (92.0/100, Red Alert)**<br>Verhoeff Checksum: FAILED. | "Even if a fake Aadhaar looks cosmetically perfect, the mathematical Verhoeff check immediately exposes the fabricated number." |
| **6. Forged Stamp & Metadata** | `Scenario 6: Forged Visa Stamp` | **HIGH RISK (69.5/100, Red Alert)**<br>Deformed stamp circularity, 'Adobe Photoshop CC' EXIF trace. | "Detects digital stamp templates and residual editing signatures in the file metadata." |
| **7. Live Presenter Matching** | `Presenter: Rohit` vs `Impersonator` vs `LIVE WEBCAM` | Instant biometric update (94.2% Match vs 22.4% Mismatch). | "Click **LIVE WEBCAM**, look into your laptop camera, snap a photo, and watch the system perform live 1:1 facial identity verification!" |
| **8. Official Dossier & Audit** | Click `EXPORT OFFICIAL INCIDENT DOSSIER` or `SHA-256 LEDGER` | Printable formal dossier with SHA-256 seal; live hash chain verification. | "Ensures durable, court-admissible audit trails for intelligence and criminal prosecution." |

---

## 🛡️ Technical Highlights

- **100% Local Execution**: No external cloud API calls or latency bottlenecks.
- **Explainability First**: No opaque black-box outputs; every risk point is tied directly to an optical anomaly, checksum breakdown, or biometric delta.
- **Cryptographic Security**: All screening verdicts are appended to a SHA-256 hash-chained ledger where any post-hoc tampering breaks the cryptographic pointer.
