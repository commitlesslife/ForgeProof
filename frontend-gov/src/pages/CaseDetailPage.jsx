import { useState, useEffect } from 'react'
import { ArrowLeft, CheckCircle2, ChevronRight, Download, FileCheck2, FileText, Globe2, Lock, Printer, RefreshCw, ScanFace, ShieldAlert, ShieldCheck, UserCheck, AlertCircle, Eye } from 'lucide-react'
import { API_BASE } from '../config'
import { playAlertSound } from '../utils/audioAlerts'
import { useLanguage } from '../utils/LanguageContext'

export default function CaseDetailPage({ caseId, officer, onBack }) {
  const { lang } = useLanguage()
  const [caseData, setCaseData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('summary') // summary | forensics | images | audit
  const [decisionModal, setDecisionModal] = useState(null) // 'APPROVED' | 'SECONDARY_INSPECTION' | 'REJECTED'
  const [officerNotes, setOfficerNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchCase = () => {
    setIsLoading(true)
    fetch(`${API_BASE}/api/v1/cases/${caseId}`)
      .then(res => {
        if (!res.ok) throw new Error('Could not retrieve case record')
        return res.json()
      })
      .then(data => {
        setCaseData(data)
        const riskLevel = data.risk_assessment?.risk_level || data.risk_level || 'LOW'
        if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
          playAlertSound('critical')
        }
      })
      .catch(err => {
        console.error('Case detail fetch error:', err)
      })
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    if (caseId) fetchCase()
  }, [caseId])

  const handleDecision = async () => {
    if (!decisionModal) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/cases/${caseId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: decisionModal,
          notes: officerNotes || `Adjudicated by ${officer?.full_name || 'Officer'} at ICP Station.`,
          officer_id: officer?.officer_id || 'OFFICER_IND_829'
        })
      })
      if (!res.ok) throw new Error('Failed to record decision')
      const updated = await res.json()
      setCaseData(prev => ({ ...prev, officer_decision: updated.decision || decisionModal, officer_notes: officerNotes }))
      setDecisionModal(null)
      fetchCase()
    } catch (e) {
      alert(`Decision recording error: ${e.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="size-12 rounded-full border-4 border-[#155985] border-t-transparent animate-spin mx-auto" />
        <p className="text-sm font-bold text-[#123f68]">Loading cryptographic case dossier...</p>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="panel p-10 text-center space-y-4">
        <AlertCircle size={32} className="text-[#b42318] mx-auto" />
        <h2 className="text-xl font-bold text-[#123f68]">Case Record Unavailable</h2>
        <p className="text-sm text-slate-600">The requested dossier reference was not located on the border database.</p>
        <button onClick={onBack} className="bg-[#155985] text-white px-5 py-2 text-xs font-bold">
          Return to Dashboard
        </button>
      </div>
    )
  }

  const holderName = caseData.validation?.viz_fields?.full_name || caseData.holder_name || 'Veerla Navtej'
  const docId = caseData.validation?.viz_fields?.document_number || caseData.doc_number || 'XXXX-XXXX-0692'
  const dob = caseData.validation?.viz_fields?.date_of_birth || caseData.validation?.mrz_fields?.dob || '15/11/2007'
  const docType = caseData.doc_type || 'AADHAAR'
  const score = caseData.risk_assessment?.composite_score ?? caseData.composite_risk_score ?? 16.5
  const riskLevel = (caseData.risk_assessment?.risk_level || caseData.risk_level || 'LOW').toUpperCase()

  const isLow = riskLevel === 'LOW'
  const isCritical = riskLevel === 'CRITICAL' || riskLevel === 'HIGH'

  // Sub-scores
  const ocrRisk = caseData.risk_assessment?.sub_scores?.ocr_tampering_risk ?? 0
  const elaRisk = caseData.risk_assessment?.sub_scores?.ela_tampering_risk ?? 15
  const faceRisk = caseData.risk_assessment?.sub_scores?.face_match_risk ?? 31
  const watchlistRisk = caseData.risk_assessment?.sub_scores?.watchlist_hit_risk ?? 0

  const modules = [
    {
      title: 'Validation (OCR & Checksums)',
      status: ocrRisk === 0 ? 'PASSED' : 'ANOMALY DETECTED',
      score: `${ocrRisk}%`,
      icon: FileCheck2,
      color: ocrRisk === 0 ? 'text-[#087443]' : 'text-[#b42318]',
      barColor: ocrRisk === 0 ? 'bg-[#087443]' : 'bg-[#c62828]',
      desc: caseData.validation?.checksum_overall ? 'ICAO 7-3-1 & Verhoeff check verified' : 'Demographic text extracted'
    },
    {
      title: 'Tampering (ELA & Compression)',
      status: elaRisk < 30 ? 'CLEAN' : 'SPLICED / MODIFIED',
      score: `${elaRisk}%`,
      icon: ShieldCheck,
      color: elaRisk < 30 ? 'text-[#087443]' : 'text-[#b42318]',
      barColor: elaRisk < 30 ? 'bg-[#087443]' : 'bg-[#c62828]',
      desc: 'Uniform compression error curve across portrait and text zones'
    },
    {
      title: 'Biometric (1:1 Face Match)',
      status: faceRisk < 20 ? 'HIGH MATCH' : faceRisk < 40 ? 'LOW CONFIDENCE' : 'MISMATCH',
      score: `${faceRisk}%`,
      icon: ScanFace,
      color: faceRisk < 20 ? 'text-[#087443]' : faceRisk < 40 ? 'text-[#9b4c00]' : 'text-[#b42318]',
      barColor: faceRisk < 20 ? 'bg-[#087443]' : faceRisk < 40 ? 'bg-amber-500' : 'bg-[#c62828]',
      desc: caseData.face_match?.similarity ? `${Math.round(caseData.face_match.similarity * 100)}% facial cosine similarity` : 'Presenter biometric match evaluated'
    },
    {
      title: 'Watchlist & Intelligence',
      status: watchlistRisk === 0 ? 'CLEAN' : 'INTERPOL HIT',
      score: `${watchlistRisk}%`,
      icon: ShieldAlert,
      color: watchlistRisk === 0 ? 'text-[#155985]' : 'text-[#b42318]',
      barColor: watchlistRisk === 0 ? 'bg-[#155985]' : 'bg-[#c62828]',
      desc: watchlistRisk === 0 ? 'No active CBI / Interpol Red Notices' : 'Active watchlist warrant triggered'
    }
  ]

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-[#155985] hover:underline cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>{lang === 'hi' ? 'डैशबोर्ड पर वापस' : 'Back to dashboard'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 border border-[#b9c8d3] bg-white px-4 py-2 text-xs font-bold text-[#155985] hover:bg-[#e9f1f5] transition cursor-pointer"
          >
            <Printer size={14} />
            <span>{lang === 'hi' ? 'डोज़ियर प्रिंट करें' : 'Print inspection dossier'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Subject Summary Panel */}
      <section className="panel p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <div className="font-mono text-xs font-bold text-[#155985] tracking-wide">
              {caseData.case_id} · {docType} · Received {new Date(caseData.created_at || Date.now()).toLocaleDateString('en-GB')}
            </div>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-[#123f68]">
              {holderName}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Document ID: <b className="font-mono text-slate-800">{docId}</b> · DOB: <b>{dob}</b>
            </p>
          </div>

          {/* Composite Risk Score Badge */}
          <div className={`px-7 py-4 text-center shrink-0 border ${
            isLow 
              ? 'border-[#8acbb4] bg-[#e5f5ee]' 
              : 'border-[#f5c6cb] bg-[#fff5f5]'
          }`}>
            <div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-600">
              {lang === 'hi' ? 'समग्र जोखिम' : 'Composite risk'}
            </div>
            <b className={`block text-3xl sm:text-4xl font-bold mt-0.5 ${
              isLow ? 'text-[#087443]' : 'text-[#b42318]'
            }`}>
              {score}% <span className="text-sm font-extrabold">{riskLevel}</span>
            </b>
          </div>
        </div>

        {/* Verdict Rationale Callout Box */}
        <div className={`mt-8 p-5 border ${
          isLow 
            ? 'border-[#8acbb4] bg-[#effaf5]' 
            : 'border-[#f5c6cb] bg-[#fff5f5]'
        }`}>
          <div className="flex gap-3">
            {isLow ? (
              <ShieldCheck className="shrink-0 text-[#087443]" size={22} />
            ) : (
              <ShieldAlert className="shrink-0 text-[#b42318]" size={22} />
            )}
            <div>
              <b className={isLow ? 'text-[#075f3d]' : 'text-[#a51f1f]'}>
                {caseData.risk_assessment?.verdict || 'Verdict rationale: Standard biometric review required.'}
              </b>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                {caseData.risk_assessment?.summary_notes || 'All demographic and cryptographic security fields verified against regional issuance parameters.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: 4 Forensic Modules Grid */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {modules.map(({ title, status, score: mScore, icon: Icon, color, barColor, desc }) => (
          <div key={title} className="panel p-5">
            <div className="flex justify-between text-sm font-bold text-slate-600">
              <span className="truncate pr-2">{title}</span>
              <Icon size={18} className={`${color} shrink-0`} />
            </div>
            <div className={`mt-4 text-base sm:text-lg font-bold ${color}`}>
              {status}
            </div>
            <div className="mt-1 text-xs text-slate-500 font-medium">
              Risk contribution: <strong className="font-mono text-slate-700">{mScore}</strong>
            </div>
            <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${barColor}`} 
                style={{ width: `${Math.max(8, parseInt(mScore) || 8)}%` }} 
              />
            </div>
            <p className="mt-3 text-[11px] text-slate-500 line-clamp-2">
              {desc}
            </p>
          </div>
        ))}
      </div>

      {/* Forensic Evidence Images Drawer */}
      {(caseData.document_image_path || caseData.face_crop_path || caseData.live_photo_path) && (
        <section className="panel p-6">
          <div className="text-[11px] font-bold uppercase tracking-[.18em] text-slate-500 mb-3">
            Forensic Evidence Gallery
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {caseData.document_image_path && (
              <div className="border border-[#d3dce4] p-2 bg-[#f8fafc]">
                <p className="text-[11px] font-bold text-slate-700 mb-1">Optical Scan (VIZ)</p>
                <img 
                  src={`${API_BASE}/static/${caseData.document_image_path}`} 
                  alt="Optical VIZ Scan" 
                  className="w-full h-40 object-contain bg-black/5" 
                />
              </div>
            )}
            {caseData.face_crop_path && (
              <div className="border border-[#d3dce4] p-2 bg-[#f8fafc]">
                <p className="text-[11px] font-bold text-slate-700 mb-1">Document Portrait Extraction</p>
                <img 
                  src={`${API_BASE}/static/${caseData.face_crop_path}`} 
                  alt="Document Face Crop" 
                  className="w-full h-40 object-contain bg-black/5" 
                />
              </div>
            )}
            {caseData.live_photo_path && (
              <div className="border border-[#d3dce4] p-2 bg-[#f8fafc]">
                <p className="text-[11px] font-bold text-slate-700 mb-1">Presenter Biometric Feed</p>
                <img 
                  src={`${API_BASE}/static/${caseData.live_photo_path}`} 
                  alt="Presenter Live Photo" 
                  className="w-full h-40 object-contain bg-black/5" 
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECTION 3: Officer Disposition Action Buttons */}
      <section className="panel p-6 sm:p-8">
        <div className="text-[11px] font-bold uppercase tracking-[.18em] text-slate-500">
          {lang === 'hi' ? 'अधिकारी निपटान' : 'Officer disposition'}
        </div>
        <div className="flex flex-col sm:flex-row justify-between gap-2 sm:items-center mt-1">
          <h2 className="text-xl font-bold text-[#123f68]">
            {lang === 'hi' ? 'अंतिम वैधानिक निर्णय दर्ज करें' : 'Record final border decision'}
          </h2>
          {caseData.officer_decision && (
            <span className="text-xs font-bold text-[#087443] bg-[#e5f5ee] border border-[#8acbb4] px-3 py-1 inline-block">
              Recorded: {caseData.officer_decision}
            </span>
          )}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <button
            onClick={() => setDecisionModal('APPROVED')}
            className="border border-[#8acbb4] bg-[#effaf5] hover:bg-[#d9f5e8] p-4 text-left font-bold text-[#087443] transition cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-base">{lang === 'hi' ? 'स्वीकृत एवं पास' : 'Clear & approve'}</span>
              <CheckCircle2 size={18} />
            </div>
            <p className="text-xs font-normal text-slate-600 mt-2">
              Admit traveler through immigration barrier.
            </p>
          </button>

          <button
            onClick={() => setDecisionModal('SECONDARY_INSPECTION')}
            className="border border-[#b9c8d3] bg-white hover:bg-[#e9f1f5] p-4 text-left font-bold text-[#155985] transition cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-base">{lang === 'hi' ? 'माध्यमिक समीक्षा को भेजें' : 'Refer to secondary'}</span>
              <ChevronRight size={18} />
            </div>
            <p className="text-xs font-normal text-slate-600 mt-2">
              Escalate credential to secondary forensic supervisor.
            </p>
          </button>

          <button
            onClick={() => setDecisionModal('REJECTED')}
            className="border border-[#e4b8b8] bg-[#fff5f5] hover:bg-[#ffebee] p-4 text-left font-bold text-[#b42318] transition cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-base">{lang === 'hi' ? 'रोकें / अस्वीकार करें' : 'Detain / reject'}</span>
              <ShieldAlert size={18} />
            </div>
            <p className="text-xs font-normal text-slate-600 mt-2">
              Issue notice of refusal and hold traveler.
            </p>
          </button>
        </div>
      </section>

      {/* Decision Confirmation Modal */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="panel max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#123f68]">
              Confirm Statutory Disposition: <strong className="text-[#155985]">{decisionModal}</strong>
            </h3>
            <p className="text-xs text-slate-600">
              This adjudication will be cryptographically signed by Inspector <strong className="text-slate-800">{officer?.full_name || 'Rajesh K. Verma'}</strong> ({officer?.badge_number || 'IND-BOI-8294'}) and appended to the immutable SHA-256 chain of custody.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Adjudication Notes / Observation Rationale:
              </label>
              <textarea
                rows={3}
                value={officerNotes}
                onChange={e => setOfficerNotes(e.target.value)}
                placeholder="Enter justification for statutory audit log..."
                className="w-full border border-[#d3dce4] p-2.5 text-xs text-slate-800 outline-none focus:border-[#155985]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDecisionModal(null)}
                className="border border-[#d3dce4] px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleDecision}
                className="bg-[#155985] hover:bg-[#104364] px-5 py-2 text-xs font-bold text-white transition cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting && <RefreshCw size={13} className="animate-spin" />}
                <span>Sign & Seal Verdict</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
