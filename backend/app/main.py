"""
ForgeProof FastAPI REST API Server (SIH 2026 Edition)
Official Endpoints conforming to PDD Section 9.1 (API & Integration Design).
"""

import os
import shutil
import uuid
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import (
    STATIC_DIR,
    UPLOADS_DIR,
    SAMPLES_DIR,
    HOST,
    PORT,
    DEBUG,
)
from app.models.schemas import (
    DecisionRequest,
    DecisionResponse,
    OfficerDecision,
    LoginRequest,
    LoginResponse,
    OfficerProfile,
)
from app.core.auth import (
    verify_officer_credentials,
    create_officer_session,
    get_officer_by_token,
    revoke_session,
)
from app.core.pipeline import process_screening_pipeline
from app.storage.case_store import case_store
from app.storage.audit_ledger import audit_ledger

from contextlib import asynccontextmanager
from app.database.session import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="ForgeProof API — AI Document Screening System",
    description="Official Border Checkpoint Identity & Travel Document Verification API (SIH 2026)",
    version="2.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Enable Cross-Origin Resource Sharing (CORS) for Vite / React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static asset directory for document scans, forensic heatmaps, face crops, and samples
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


# =============================================================================
# Health & Status Endpoint
# =============================================================================
@app.get("/")
def root():
    return {
        "service": "ForgeProof AI Border Screening Engine",
        "status": "ONLINE",
        "version": "2.1.0-SIH26",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

@app.get("/api/v1/health")
def health_check():
    """System liveness, readiness, and capability probe."""
    return {
        "status": "ONLINE",
        "service": "ForgeProof AI Border Screening Engine",
        "version": "2.1.0-SIH26",
        "supported_documents": [
            "Indian Passport (ICAO Doc 9303 TD3)",
            "Aadhaar Card (UIDAI Verhoeff D5)",
            "PAN Card (ITD Entity Standard)",
            "Driving Licence (MoRTH Sarathi Standard)",
            "International Visas (ICAO Doc 9303 TD2)"
        ],
        "ledger_integrity": audit_ledger.verify_integrity(),
        "active_cases": len(case_store.list_cases())
    }


# =============================================================================
# Production Authentication Endpoints
# =============================================================================
@app.post("/api/v1/auth/login", response_model=LoginResponse)
def login_officer(req: LoginRequest):
    """
    Authenticates an official border screening officer with hashed password verification.
    Supports official accounts (e.g. OFFICER_IND_829) and 'admin' / 'admin' bypass.
    """
    officer = verify_officer_credentials(req.officer_id, req.password)
    if not officer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Officer ID or password. Access denied."
        )
    
    token = create_officer_session(officer)
    
    # Record authentication event in audit trail
    audit_ledger.record_event(
        case_id="AUTH_SESSION",
        action="OFFICER_AUTHENTICATED",
        officer_id=officer["officer_id"],
        verdict="AUTHORIZED",
        risk_score=0.0,
        notes=f"Officer {officer['full_name']} logged in at {officer['duty_station']}"
    )
    
    return {
        "success": True,
        "token": token,
        "officer": officer
    }


@app.get("/api/v1/auth/me")
def get_current_officer(authorization: Optional[str] = Header(None)):
    """Validates session token and returns active officer details."""
    token = authorization.replace("Bearer ", "").strip() if authorization else None
    officer = get_officer_by_token(token)
    if not officer:
        # Fallback to default admin for unauthenticated dev queries
        return {
            "authenticated": False,
            "officer_id": "OFFICER_IND_829",
            "full_name": "Senior Inspector",
            "duty_station": "Immigration Inspection Wing"
        }
    return {
        "authenticated": True,
        **officer
    }


@app.post("/api/v1/auth/logout")
def logout_officer(authorization: Optional[str] = Header(None)):
    """Revokes active officer session token."""
    token = authorization.replace("Bearer ", "").strip() if authorization else None
    if token:
        revoke_session(token)
    return {"success": True, "message": "Logged out successfully."}


# =============================================================================
# PDD Section 9.1: Case Ingestion & Screening Endpoints
# =============================================================================
@app.post("/api/v1/cases", status_code=status.HTTP_201_CREATED)
@app.post("/api/v1/cases/screen", status_code=status.HTTP_201_CREATED)
@app.post("/api/v1/cases/analyze") # Backward compatibility alias
def create_and_screen_case(
    doc_file: UploadFile = File(...),
    live_file: Optional[UploadFile] = File(None),
    doc_type: str = Form("PASSPORT")
):
    """
    Primary ingestion endpoint conforming to PDD Section 9.1:
    Creates a screening case, saves captures, and runs full end-to-end AI pipeline.
    """
    case_id = f"CASE_{uuid.uuid4().hex[:8].upper()}"

    # Save document capture
    doc_ext = os.path.splitext(doc_file.filename or "doc.jpg")[1] or ".jpg"
    doc_saved_path = os.path.join(str(UPLOADS_DIR), f"{case_id}_doc{doc_ext}")
    with open(doc_saved_path, "wb") as buffer:
        shutil.copyfileobj(doc_file.file, buffer)

    # Save live face capture if provided
    live_saved_path = None
    if live_file:
        live_ext = os.path.splitext(live_file.filename or "live.jpg")[1] or ".jpg"
        live_saved_path = os.path.join(str(UPLOADS_DIR), f"{case_id}_live{live_ext}")
        with open(live_saved_path, "wb") as buffer:
            shutil.copyfileobj(live_file.file, buffer)

    result = process_screening_pipeline(
        doc_path=doc_saved_path,
        live_path=live_saved_path,
        doc_type=doc_type,
        case_id=case_id,
        original_filename=doc_file.filename
    )
    return result



@app.get("/api/v1/cases")
def list_cases():
    """Retrieve all cases."""
    return case_store.list_cases()

@app.get("/api/v1/cases/{case_id}")
def get_case(case_id: str):
    """Retrieves full case record including quality, OCR, validation, forensics, and biometrics."""
    case = case_store.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")
    return case


@app.get("/api/v1/cases/{case_id}/ocr")
def get_case_ocr(case_id: str):
    """PDD Section 9.1: Retrieve extracted OCR fields."""
    case = case_store.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")
    return {
        "case_id": case_id,
        "doc_type": case["doc_type"],
        "viz_fields": case["validation"]["viz_fields"],
        "mrz": case["validation"].get("mrz")
    }


@app.get("/api/v1/cases/{case_id}/validation")
def get_case_validation(case_id: str):
    """PDD Section 9.1: Retrieve document validation & checksum results."""
    case = case_store.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")
    return {
        "case_id": case_id,
        "validation": case["validation"]
    }


@app.get("/api/v1/cases/{case_id}/tampering")
def get_case_tampering(case_id: str):
    """PDD Section 9.1: Retrieve tampering-detection results and evidence."""
    case = case_store.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")
    return {
        "case_id": case_id,
        "tampering": case["tampering"]
    }


@app.get("/api/v1/cases/{case_id}/face-match")
def get_case_face_match(case_id: str):
    """PDD Section 9.1: Retrieve face verification result and confidence."""
    case = case_store.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")
    return {
        "case_id": case_id,
        "face_match": case["face_match"]
    }


@app.get("/api/v1/cases/{case_id}/risk-score")
def get_case_risk_score(case_id: str):
    """PDD Section 9.1: Retrieve the composite risk score and category."""
    case = case_store.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")
    return {
        "case_id": case_id,
        "risk_assessment": case["risk_assessment"]
    }


@app.post("/api/v1/cases/{case_id}/decision")
def record_decision(case_id: str, decision: DecisionRequest):
    """
    PDD Section 9.1: Record human-in-the-loop officer verdict and notes.
    Appends the action immutably to the SHA-256 cryptographic audit ledger.
    """
    case = case_store.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

    audit_entry = audit_ledger.record_event(
        case_id=case_id,
        action="OFFICER_DECISION_RECORDED",
        officer_id=decision.officer_id or "OFFICER_IND_829",
        verdict=decision.verdict,
        risk_score=case["risk_assessment"]["composite_score"],
        notes=decision.notes or ""
    )

    officer_dec = {
        "verdict": decision.verdict,
        "officer_id": decision.officer_id or "OFFICER_IND_829",
        "notes": decision.notes,
        "recorded_at": audit_entry["timestamp"]
    }
    case_store.update_decision(case_id, officer_dec)

    return {
        "success": True,
        "case_id": case_id,
        "verdict": decision.verdict,
        "officer_decision": officer_dec,
        "audit_entry": audit_entry
    }


# =============================================================================
# Cryptographic Audit Ledger Endpoints
# =============================================================================
@app.get("/api/v1/audit")
def get_audit_trail():
    """PDD Section 11: Retrieves the cryptographic audit ledger with integrity verification."""
    is_intact = audit_ledger.verify_integrity()
    logs = audit_ledger.get_all_logs()
    return {
        "integrity": is_intact,
        "total_entries": len(logs),
        "ledger": logs
    }


@app.get("/api/v1/audit/{case_id}")
def get_case_audit_trail(case_id: str):
    """PDD Section 9.1: Retrieve the full audit trail for a specific case."""
    is_intact = audit_ledger.verify_integrity()
    logs = audit_ledger.get_case_logs(case_id)
    return {
        "case_id": case_id,
        "integrity": is_intact,
        "total_entries": len(logs),
        "events": logs
    }


# =============================================================================
# Showcase Presets (for 1-Click Evaluation / SIH 2026 Presentation)
# =============================================================================
@app.get("/api/v1/presets")
def list_presets():
    return [
        {
            "id": "scenario1_genuine_passport",
            "title": "Scenario 1: Genuine Indian Passport",
            "subtitle": "Rohit Sharma | Republic of India",
            "expected_tier": "LOW",
            "expected_score": 8.0,
            "badge": "All Features Valid",
            "doc_filename": "scenario1_genuine_indian_passport.jpg",
            "live_filename": "presenter_rohit_matching.jpg",
            "doc_type": "PASSPORT",
            "highlights": "Valid ICAO 9303 7-3-1 check digits, 94.2% facial match, authentic entry stamp, zero ELA anomalies."
        },
        {
            "id": "scenario2_photo_splice",
            "title": "Scenario 2: Spliced Photo Replacement",
            "subtitle": "Passport Photo Tampered | Impersonator",
            "expected_tier": "HIGH",
            "expected_score": 88.0,
            "badge": "Critical Splice Detected",
            "doc_filename": "scenario2_tampered_photo_splice.jpg",
            "live_filename": "presenter_rohit_matching.jpg",
            "doc_type": "PASSPORT",
            "highlights": "Photo boundary discontinuity detected (variance 26k), ELA compression heat signature, facial mismatch."
        },
        {
            "id": "scenario3_date_fraud",
            "title": "Scenario 3: Date Fraud & MRZ Checksum Mismatch",
            "subtitle": "Printed Expiry 2036 vs Encoded 2031",
            "expected_tier": "HIGH",
            "expected_score": 80.0,
            "badge": "Checksum Mismatch",
            "doc_filename": "scenario3_tampered_date_mrz_mismatch.jpg",
            "live_filename": "presenter_rohit_matching.jpg",
            "doc_type": "PASSPORT",
            "highlights": "Printed expiry modified to 2036; MRZ check digit fails mathematical 7-3-1 verification."
        },
        {
            "id": "scenario4_genuine_aadhaar",
            "title": "Scenario 4: Genuine Indian Aadhaar Card",
            "subtitle": "UIDAI Official Verhoeff D5 Checksum",
            "expected_tier": "LOW",
            "expected_score": 8.0,
            "badge": "UIDAI Verhoeff Pass",
            "doc_filename": "scenario4_genuine_indian_aadhaar.jpg",
            "live_filename": "presenter_rohit_matching.jpg",
            "doc_type": "AADHAAR",
            "highlights": "Valid 12-digit UIDAI standard, Verhoeff dihedral group D5 check digit verified, biometric match."
        },
        {
            "id": "scenario5_tampered_aadhaar",
            "title": "Scenario 5: Tampered Aadhaar (Invalid Verhoeff)",
            "subtitle": "Fabricated 12-Digit UID Number",
            "expected_tier": "HIGH",
            "expected_score": 92.0,
            "badge": "Mathematical Checksum Fail",
            "doc_filename": "scenario5_tampered_aadhaar_invalid_verhoeff.jpg",
            "live_filename": "presenter_rohit_matching.jpg",
            "doc_type": "AADHAAR",
            "highlights": "Aadhaar UID fails Verhoeff check digit validation; spliced cardholder photograph flagged."
        },
        {
            "id": "scenario6_forged_visa",
            "title": "Scenario 6: Forged Visa & Photoshop Signature",
            "subtitle": "Deformed Entry Seal & Software Metadata",
            "expected_tier": "HIGH",
            "expected_score": 70.0,
            "badge": "Stamp Forgery & EXIF",
            "doc_filename": "scenario6_forged_visa_stamp.jpg",
            "live_filename": "presenter_rohit_matching.jpg",
            "doc_type": "VISA",
            "highlights": "Deformed official stamp contour circularity and Adobe Photoshop CC export metadata trace."
        }
    ]


@app.post("/api/v1/cases/preset/{preset_id}")
def run_preset_scenario(preset_id: str, live_mode: str = "default"):
    """Runs one of the showcase demo presets in < 1 second."""
    presets = {p["id"]: p for p in list_presets()}
    if preset_id not in presets:
        raise HTTPException(status_code=404, detail="Preset scenario not found")

    p = presets[preset_id]
    doc_path = os.path.join(str(SAMPLES_DIR), p["doc_filename"])

    if live_mode == "impersonator":
        live_path = os.path.join(str(SAMPLES_DIR), "presenter_impersonator_mismatch.jpg")
    from app.core.pipeline import run_preset_scenario_pipeline
    result = run_preset_scenario_pipeline(
        preset_id=preset_id,
        doc_path=doc_path,
        live_path=live_path,
        doc_type=p["doc_type"]
    )
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=DEBUG)
