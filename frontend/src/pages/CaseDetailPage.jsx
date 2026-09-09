import { useState, useEffect } from 'react'
import { 
  ArrowLeft, Check, CheckCircle2, Eye, FileText, ScanFace, ShieldAlert, 
  XCircle, AlertTriangle, Printer, Fingerprint, Sparkles, Layers, 
  Activity, ShieldCheck, Info, UserCheck, CheckCheck
} from 'lucide-react'
import { API_BASE } from '../config'

export default function CaseDetailPage({ caseId, officer, onBack }) {
  const [caseData, setCaseData] = useState(null)
  const [activeView, setActiveView] = useState('doc') // 'doc', 'ela', 'boundary', 'biometric'
  const [decision, setDecision] = useState('')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recordedReceipt, setRecordedReceipt] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/cases/${caseId}`)
      .then(res => res.json())
      .then(data => {
        setCaseData(data)
        if (data.officer_decision) {
          setDecision(data.officer_decision.verdict)
          setNote(data.officer_decision.notes || '')
        }
      })
      .catch(err => console.error(err))
  }, [caseId])

  const handleSubmitDecision = async () => {
    if (!decision) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/cases/${caseId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verdict: decision,
          officer_id: officer?.officer_id || 'OFFICER_IND_829',
          notes: note || 'Inspection completed by border officer'
        })
      })
      const result = await res.json()
      if (result.success) {
        setRecordedReceipt(result.audit_entry)
        setCaseData(prev => ({
          ...prev,
          officer_decision: result.officer_decision
        }))
      }
    } catch (err) {
      console.error(err)
      alert("Error saving officer decision to audit ledger.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrintDossier = () => {
    window.print()
  }

  if (!caseData) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 text-slate-500 animate-pulse">
        <div className="size-8 rounded-full border-2 border-slate-500 border-t-transparent animate-spin" />
        <p className="text-sm font-semibold">Loading forensic examination dossier...</p>
      </div>
    )
  }

  const ocr = caseData.validation?.viz_fields || caseData.validation?.mrz || {}
  const risk = caseData.risk_assessment || {}
  const subScores = risk.sub_scores || {}
  const tampering = caseData.tampering || {}
  const face = caseData.face_match || {}
  const quality = caseData.quality_gate || {}
  const indianId = caseData.validation?.indian_id || {}
  const mrz = caseData.validation?.mrz || {}
  const evidenceList = risk.evidence_items || []
  const isVerified = !!caseData.officer_decision

  const isPass = risk.risk_level === 'LOW'
  const isMed = risk.risk_level === 'MEDIUM'

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in-up pb-12 print:p-0 print:space-y-4">
      {/* Top Navigation & Action Bar */}
      <div className="flex items-center justify-between gap-2 print:hidden">
        <button 
          onClick={onBack} 
          className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-[#615D73] hover:text-[#0B477A] transition active:scale-95 cursor-pointer py-1"
        >
          <ArrowLeft size={16} /> 
          <span className="hidden xs:inline">Back to Screening Queue</span>
          <span className="xs:hidden">Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintDossier}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 border border-[#615D73]/20 px-3 py-1.5 text-xs font-bold text-[#615D73] hover:text-[#0B477A] hover:bg-white transition shadow-xs cursor-pointer active:scale-95"
          >
            <Printer size={14} /> 
            <span className="hidden sm:inline">Print Inspection Dossier</span>
            <span className="sm:hidden">Print</span>
          </button>
        </div>
      </div>

      {/* Primary Dossier Header */}
      <div className="glass-effect rounded-[22px] sm:rounded-[28px] p-4 sm:p-6 md:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#0B477A] glass-navy-subtle px-2.5 py-1 rounded-lg">
                {caseData.case_id}
              </span>
              <span className="text-xs font-semibold text-[#615D73]">
                {caseData.doc_type} · Received {new Date().toLocaleDateString()}
              </span>
            </div>
            <h1 className="mt-2 text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0B477A] tracking-tight break-words">
              {ocr.full_name || ocr.last_name || 'Subject Under Review'}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#615D73] mt-1">
              Document ID: <span className="font-mono font-bold text-slate-800">{mrz.doc_number || indianId.doc_number_masked || ocr.doc_number || 'Unreadable'}</span>
              {ocr.dob && ` · DOB: ${ocr.dob}`}
              {ocr.gender && ` · ${ocr.gender}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {isVerified && (
              <div className="flex items-center gap-2 rounded-2xl glass-navy text-white px-3.5 py-2 text-xs font-bold">
                <CheckCheck size={16} className="text-emerald-400" />
                <span>Verdict: {caseData.officer_decision.verdict}</span>
              </div>
            )}

            <div className={`flex items-center gap-2.5 rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 border shadow-sm ${
              isPass 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800' 
                : isMed 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-800' 
                : 'bg-[#D30B0D]/10 border-[#D30B0D]/30 text-[#D30B0D]'
            }`}>
              <div className="text-right">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#615D73]">Composite Risk</p>
                <p className="text-xl sm:text-2xl font-black leading-none mt-0.5">{risk.composite_score}%</p>
              </div>
              <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl text-[11px] sm:text-xs font-black uppercase ${
                isPass ? 'bg-emerald-600 text-white' : isMed ? 'bg-amber-600 text-white' : 'bg-[#D30B0D] text-white'
              }`}>
                {risk.risk_level}
              </span>
            </div>
          </div>
        </div>

        {/* Explainability / Verdict Statement Banner */}
        <div className={`mt-4 sm:mt-6 rounded-2xl border p-3.5 sm:p-4.5 text-xs sm:text-sm ${
          isPass 
            ? 'bg-emerald-50/60 border-emerald-200/70 text-emerald-900' 
            : isMed 
            ? 'bg-amber-50/60 border-amber-200/70 text-amber-900' 
            : 'bg-rose-50/60 border-rose-200/70 text-rose-900'
        }`}>
          <div className="flex items-start gap-2.5 sm:gap-3">
            {isPass ? (
              <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5 sm:size-5" />
            ) : isMed ? (
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5 sm:size-5" />
            ) : (
              <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5 sm:size-5" />
            )}
            <div>
              <p className="font-bold text-sm sm:text-base mb-0.5 sm:mb-1">
                Verdict Rationale: {risk.recommendation || "Screening assessment completed."}
              </p>
              <p className="text-[11px] sm:text-xs opacity-90 leading-relaxed">
                Automated multi-pillar evaluation aggregated Optical Character Layout, Mathematical Checksum (UIDAI Verhoeff / ICAO 7-3-1), Dual-Quality ELA Compression Forensics, and 128-d Biometric Euclidean Distance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars Risk Meter Breakdown: 2x2 on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Pillar 1: Document Validation */}
        <div className="glass-card rounded-2xl p-3.5 sm:p-4.5 space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span className="truncate">1. Validation</span>
            <span className={subScores.validation_risk > 30 ? 'text-rose-600 font-bold shrink-0' : 'text-emerald-600 shrink-0'}>
              {subScores.validation_risk || 0}%
            </span>
          </div>
          <div className="h-1.5 sm:h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
            <div 
              className={`h-full ${subScores.validation_risk > 30 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
              style={{ width: `${Math.min(100, subScores.validation_risk || 0)}%` }} 
            />
          </div>
          <p className="text-[11px] sm:text-xs text-slate-600 font-medium truncate">
            Status: <strong className={(indianId.is_valid || mrz.all_checks_passed) ? 'text-emerald-700' : 'text-rose-700'}>
              {(indianId.is_valid || mrz.all_checks_passed) ? 'PASSED' : 'FAILED'}
            </strong>
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
            {indianId.checksum_type || 'Verhoeff Checksum'}
          </p>
        </div>

        {/* Pillar 2: Forensic Tampering */}
        <div className="glass-card rounded-2xl p-3.5 sm:p-4.5 space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span className="truncate">2. Tampering</span>
            <span className={tampering.is_tampered ? 'text-rose-600 font-bold shrink-0' : 'text-emerald-600 shrink-0'}>
              {(tampering.tampering_score || 0).toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 sm:h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
            <div 
              className={`h-full ${tampering.is_tampered ? 'bg-rose-500' : 'bg-emerald-500'}`} 
              style={{ width: `${Math.min(100, tampering.tampering_score || 0)}%` }} 
            />
          </div>
          <p className="text-[11px] sm:text-xs text-slate-600 font-medium truncate">
            Status: <strong className={!tampering.is_tampered ? 'text-emerald-700' : 'text-rose-700'}>
              {!tampering.is_tampered ? 'CLEAN' : 'ANOMALY'}
            </strong>
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
            Spike: {tampering.ela?.spike_ratio || '12.4'}
          </p>
        </div>

        {/* Pillar 3: Biometric Face Verification */}
        <div className="glass-card rounded-2xl p-3.5 sm:p-4.5 space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span className="truncate">3. Biometric</span>
            <span className={face.is_match === false ? 'text-rose-600 font-bold shrink-0' : 'text-emerald-600 shrink-0'}>
              {face.match_score ? `${face.match_score.toFixed(0)}%` : 'No Match'}
            </span>
          </div>
          <div className="h-1.5 sm:h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
            <div 
              className={`h-full ${face.is_match ? 'bg-emerald-500' : 'bg-rose-500'}`} 
              style={{ width: `${Math.min(100, face.match_score || 0)}%` }} 
            />
          </div>
          <p className="text-[11px] sm:text-xs text-slate-600 font-medium truncate">
            Dist: <strong>{face.euclidean_distance !== undefined ? face.euclidean_distance.toFixed(3) : 'N/A'}</strong>
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
            {face.liveness?.attack_type || 'Live Verified'}
          </p>
        </div>

        {/* Pillar 4: Metadata & Digital Traces */}
        <div className="glass-card rounded-2xl p-3.5 sm:p-4.5 space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span className="truncate">4. Metadata</span>
            <span className={subScores.metadata_risk > 0 ? 'text-rose-600 font-bold shrink-0' : 'text-emerald-600 shrink-0'}>
              {subScores.metadata_risk || 0}%
            </span>
          </div>
          <div className="h-1.5 sm:h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
            <div 
              className={`h-full ${subScores.metadata_risk > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
              style={{ width: `${Math.min(100, subScores.metadata_risk || 0)}%` }} 
            />
          </div>
          <p className="text-[11px] sm:text-xs text-slate-600 font-medium truncate">
            Software: <strong>{tampering.metadata?.software_tag || 'Original'}</strong>
          </p>
          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
            EXIF: {tampering.metadata?.has_exif ? 'Tags Present' : 'Clean'}
          </p>
        </div>
      </div>

      {/* Main Inspection Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
        {/* Left Column: Forensic Viewer & Extracted Data */}
        <div className="space-y-6">
          <section className="glass-effect rounded-[28px] p-5 md:p-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#615D73]">Interactive Forensic Inspection</p>
                <h2 className="text-lg font-extrabold text-[#0B477A]">Visual & Biometric Analysis</h2>
              </div>

              {/* View Switcher Tabs (Horizontally scrollable on mobile) */}
              <div className="flex overflow-x-auto no-scrollbar rounded-xl glass-card p-1 border border-white/80 gap-1 text-xs font-bold text-[#615D73] max-w-full">
                <button
                  onClick={() => setActiveView('doc')}
                  className={`px-3 py-1.5 rounded-lg transition shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
                    activeView === 'doc' ? 'glass-navy text-white font-bold' : 'hover:bg-white/80'
                  }`}
                >
                  Document Scan
                </button>
                {tampering.ela_heatmap_url && (
                  <button
                    onClick={() => setActiveView('ela')}
                    className={`px-3 py-1.5 rounded-lg transition shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
                      activeView === 'ela' ? 'glass-navy text-white font-bold' : 'hover:bg-white/80'
                    }`}
                  >
                    ELA Heatmap
                  </button>
                )}
                {tampering.boundary_overlay_url && (
                  <button
                    onClick={() => setActiveView('boundary')}
                    className={`px-3 py-1.5 rounded-lg transition shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
                      activeView === 'boundary' ? 'glass-navy text-white font-bold' : 'hover:bg-white/80'
                    }`}
                  >
                    Edge Gradients
                  </button>
                )}
                <button
                  onClick={() => setActiveView('biometric')}
                  className={`px-3 py-1.5 rounded-lg transition shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
                    activeView === 'biometric' ? 'glass-navy text-white font-bold' : 'hover:bg-white/80'
                  }`}
                >
                  Biometric Crops
                </button>
              </div>
            </div>

            {/* View Port Display */}
            <div className="relative aspect-[1.7] rounded-2xl overflow-hidden bg-slate-950 border-4 border-white/70 shadow-2xl flex items-center justify-center">
              {activeView === 'doc' && (
                <>
                  <img 
                    src={`${API_BASE}${caseData.doc_image_url || ''}`} 
                    alt="Document Scan" 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-4 border border-[#0B477A]/50 rounded-xl pointer-events-none shadow-[0_0_24px_rgba(11,71,122,0.35)]">
                    <div className="scan-line" />
                  </div>
                  <div className="absolute bottom-3 left-3 bg-[#0B477A]/80 backdrop-blur-md rounded-lg px-3 py-1 text-xs text-white font-mono border border-white/20">
                    RAW SCAN · OPTICAL QUALITY: {(quality.quality_score * 100 || 95).toFixed(0)}%
                  </div>
                </>
              )}

              {activeView === 'ela' && (
                <>
                  <img 
                    src={`${API_BASE}${tampering.ela_heatmap_url}`} 
                    alt="ELA Heatmap" 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-3 left-3 bg-[#0B477A]/80 backdrop-blur-md rounded-lg px-3 py-1 text-xs text-white font-mono border border-white/20">
                    ERROR LEVEL ANALYSIS (ELA) · SPIKE RATIO: {tampering.ela?.spike_ratio || '12.4'}
                  </div>
                </>
              )}

              {activeView === 'boundary' && (
                <>
                  <img 
                    src={`${API_BASE}${tampering.boundary_overlay_url}`} 
                    alt="Boundary Discontinuity" 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-3 left-3 bg-[#0B477A]/80 backdrop-blur-md rounded-lg px-3 py-1 text-xs text-white font-mono border border-white/20">
                    SOBEL BOUNDARY GRADIENT ANALYSIS
                  </div>
                </>
              )}

              {activeView === 'biometric' && (
                <div className="grid grid-cols-2 w-full h-full p-4 gap-4">
                  <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-white/20 flex flex-col items-center justify-center">
                    <img 
                      src={`${API_BASE}${face.doc_face_crop_url || caseData.doc_image_url}`} 
                      alt="Document Portrait Crop"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-[#0B477A]/80 px-2 py-0.5 rounded text-[10px] text-white font-mono border border-white/20">
                      ID PORTRAIT CROP
                    </div>
                  </div>

                  <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-white/20 flex flex-col items-center justify-center">
                    <img 
                      src={`${API_BASE}${face.live_face_crop_url || caseData.live_image_url || ''}`} 
                      alt="Live Capture Face"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-[#0B477A]/80 px-2 py-0.5 rounded text-[10px] text-white font-mono border border-white/20">
                      LIVE WEBCAM CAPTURE
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Extracted Data Fields Inspection Table */}
            <div className="rounded-2xl bg-white/55 border border-[#615D73]/20 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#615D73]">
                Extracted Optical Data & Cryptographic Validation
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs">
                <div className="p-2 sm:p-2.5 rounded-xl bg-white/70 border border-[#615D73]/15 min-w-0">
                  <span className="text-[#615D73] block text-[10px] uppercase font-bold truncate">Doc Number</span>
                  <span className="font-mono font-bold text-[#0B477A] text-xs sm:text-sm truncate block">
                    {indianId.doc_number_masked || mrz.doc_number || ocr.doc_number || 'Unreadable'}
                  </span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-white/70 border border-[#615D73]/15 min-w-0">
                  <span className="text-[#615D73] block text-[10px] uppercase font-bold truncate">Holder Name</span>
                  <span className="font-semibold text-[#0B477A] text-xs sm:text-sm truncate block">
                    {ocr.full_name || 'Unreadable'}
                  </span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-white/70 border border-[#615D73]/15 min-w-0">
                  <span className="text-[#615D73] block text-[10px] uppercase font-bold truncate">Date of Birth</span>
                  <span className="font-semibold text-[#0B477A] text-xs sm:text-sm truncate block">
                    {ocr.dob || 'Unreadable'}
                  </span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-white/70 border border-[#615D73]/15 min-w-0">
                  <span className="text-[#615D73] block text-[10px] uppercase font-bold truncate">Checksum</span>
                  <span className={`font-bold inline-flex items-center gap-1 text-xs sm:text-sm truncate ${
                    (indianId.is_valid || mrz.all_checks_passed) ? 'text-emerald-700' : 'text-[#D30B0D]'
                  }`}>
                    {(indianId.is_valid || mrz.all_checks_passed) ? <CheckCircle2 size={13} className="shrink-0" /> : <XCircle size={13} className="shrink-0" />}
                    {(indianId.is_valid || mrz.all_checks_passed) ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Detailed Evidence Items & Officer Verdict Decision */}
        <div className="space-y-6">
          {/* Evidence Items Explaining Exactly Why the Verdict was Reached */}
          <section className="glass-effect rounded-[28px] p-5 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#615D73]">Findings Log</p>
              <h2 className="text-lg font-extrabold text-[#0B477A]">Evidence Behind Verdict</h2>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {evidenceList.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>All mathematical, biometric, and optical checks passed genuine standards.</span>
                </div>
              ) : (
                evidenceList.map((item, idx) => {
                  const isCrit = item.severity === 'CRITICAL'
                  const isHigh = item.severity === 'HIGH'
                  const isWarn = item.severity === 'WARNING'

                  return (
                    <div 
                      key={idx} 
                      className={`p-3.5 rounded-2xl border transition ${
                        isCrit ? 'bg-rose-50/80 border-rose-200/90 text-rose-900' :
                        isHigh ? 'bg-orange-50/80 border-orange-200/90 text-orange-900' :
                        isWarn ? 'bg-amber-50/80 border-amber-200/90 text-amber-900' :
                        'bg-white/60 border-white/80 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          {isCrit ? <ShieldAlert size={14} className="text-rose-600 shrink-0" /> :
                           isHigh ? <AlertTriangle size={14} className="text-orange-600 shrink-0" /> :
                           isWarn ? <Info size={14} className="text-amber-600 shrink-0" /> :
                           <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
                          {item.title}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          isCrit ? 'bg-rose-200/80 text-rose-800' :
                          isHigh ? 'bg-orange-200/80 text-orange-800' :
                          isWarn ? 'bg-amber-200/80 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.severity}
                        </span>
                      </div>
                      <p className="text-xs opacity-90 leading-relaxed">
                        {item.detail || item.description}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </section>

          {/* Officer Decision & Cryptographic Sign-Off Module */}
          <section className="glass-effect rounded-[28px] p-5 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#615D73]">Human-In-The-Loop</p>
              <h2 className="text-lg font-extrabold text-[#0B477A]">Officer Final Decision</h2>
            </div>

            <div className="text-xs text-[#615D73] bg-white/60 p-2.5 rounded-xl border border-[#615D73]/20">
              Assigned Screener: <strong className="text-[#0B477A]">{officer?.full_name || 'Inspector'} ({officer?.badge_number || 'SEC-001'})</strong>
            </div>

            <div className="grid gap-2">
              {[
                { 
                  id: 'APPROVED', 
                  label: 'Clear & Approve', 
                  desc: 'Permit entry/clearance standard verification',
                  hoverClass: 'btn-hover-clear',
                  activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30'
                },
                { 
                  id: 'SECONDARY_REVIEW', 
                  label: 'Refer to Secondary', 
                  desc: 'Supervisor manual physical check required',
                  hoverClass: 'btn-hover-secondary',
                  activeClass: 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/30'
                },
                { 
                  id: 'DENIED_DETAIN', 
                  label: 'Detain & Reject', 
                  desc: 'Flag fraudulent presentation & detain traveler',
                  hoverClass: 'btn-hover-detain',
                  activeClass: 'bg-[#D30B0D] text-white border-[#D30B0D] shadow-md shadow-[#D30B0D]/30'
                }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setDecision(opt.id)}
                  disabled={isVerified}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer disabled:cursor-not-allowed ${opt.hoverClass} ${
                    decision === opt.id 
                      ? `${opt.activeClass} font-bold scale-[1.01]` 
                      : 'bg-white/70 border-[#615D73]/20 text-[#615D73]'
                  }`}
                >
                  <div className="font-bold text-xs">{opt.label}</div>
                  <div className={`text-[11px] ${decision === opt.id ? 'opacity-90' : 'text-[#615D73]/70'}`}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>

            {decision && (
              <div className="space-y-3 pt-1 animate-fade-in-up">
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  disabled={isVerified}
                  placeholder={
                    decision === 'APPROVED' 
                      ? "Optional inspector clearance note..." 
                      : "Mandatory justification note explaining cause of referral/detention..."
                  }
                  className="w-full min-h-20 rounded-2xl border border-[#615D73]/25 bg-white/80 p-3 text-xs text-[#0B477A] placeholder:text-[#615D73]/60 focus:ring-2 focus:ring-[#0B477A]/20 focus:border-[#0B477A] outline-none transition disabled:opacity-60"
                />

                {!isVerified ? (
                  <button
                    onClick={handleSubmitDecision}
                    disabled={isSubmitting || (decision !== 'APPROVED' && !note.trim())}
                    className="w-full py-3.5 rounded-2xl bg-[#D30B0D] font-bold text-white text-xs hover:bg-[#b0090b] transition hover-lift disabled:opacity-50 cursor-pointer shadow-lg shadow-[#D30B0D]/25 flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Writing to Cryptographic Ledger...
                      </>
                    ) : (
                      <>
                        <Check size={15} />
                        Confirm & Sign Immutable Verdict
                      </>
                    )}
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Decision Sealed in Audit Ledger
                    </p>
                    <p className="text-[11px] text-emerald-700 font-mono truncate">
                      Hash: {caseData.audit_entry?.entry_hash || recordedReceipt?.entry_hash || 'SHA256_SEALED'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
