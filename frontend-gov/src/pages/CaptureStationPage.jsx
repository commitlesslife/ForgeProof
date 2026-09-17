import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, ChevronRight, FileText, Globe2, IdCard, Landmark, RefreshCw, ScanFace, ShieldAlert, Sparkles, SwitchCamera, UploadCloud, X, Play } from 'lucide-react'
import { API_BASE } from '../config'
import { PageIntro } from '../components/PortalShell'
import { useLanguage } from '../utils/LanguageContext'

const DOC_TYPES = [
  { 
    id: 'AADHAAR', 
    title: 'Aadhaar Card', 
    desc: 'Official Aadhaar identity document', 
    sub: 'UIDAI issued demographic & cryptographic card', 
    icon: IdCard 
  },
  { 
    id: 'PASSPORT', 
    title: 'Passport (ICAO Doc 9303)', 
    desc: 'Indian or foreign international passport', 
    sub: 'Machine Readable Travel Document (TD1/TD2/TD3)', 
    icon: Globe2 
  },
  { 
    id: 'PAN', 
    title: 'Permanent Account Number (PAN)', 
    desc: 'Income tax identity document', 
    sub: 'Department of Revenue Taxpayer Card', 
    icon: FileText 
  },
  { 
    id: 'DRIVING_LICENSE', 
    title: 'Driving Licence', 
    desc: 'State-issued operator permit', 
    sub: 'MoRTH Sarathi national registry', 
    icon: Landmark 
  },
  { 
    id: 'VOTER_ID', 
    title: 'Voter Identity Card', 
    desc: 'Election identity document', 
    sub: 'Election Commission of India (EPIC)', 
    icon: IdCard 
  }
]

const CALIBRATION_PRESETS = [
  {
    id: 'deck_authentic',
    tag: 'AUTHENTIC CLEARANCE',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    title: 'Genuine Indian Passport (ICAO Doc 9303)',
    subtitle: 'Standard admissible presentation with 1:1 facial match',
    docType: 'PASSPORT',
    docFile: 'scenario1_genuine_indian_passport.jpg',
    faceFile: 'presenter_rohit_matching.jpg',
    summary: 'Full MRZ checksum integrity, uniform ELA curve, 96.4% biometric face match.',
    expected: 'LOW RISK · ADMISSIBLE'
  },
  {
    id: 'deck_photo_splice',
    tag: 'PHOTO SPLICE FORGERY',
    tagColor: 'bg-rose-50 text-rose-700 border-rose-300',
    title: 'Tampered Passport · Photo Splice Overlay',
    subtitle: 'Physical visual alteration and portrait substitution',
    docType: 'PASSPORT',
    docFile: 'scenario2_tampered_photo_splice.jpg',
    faceFile: 'presenter_impersonator_mismatch.jpg',
    summary: 'High-frequency ELA noise around portrait frame, biometric mismatch against presenter.',
    expected: 'HIGH RISK · ANOMALY TRIGGERED'
  },
  {
    id: 'deck_verhoeff_fail',
    tag: 'VERHOEFF CHECKSUM FAIL',
    tagColor: 'bg-amber-50 text-amber-700 border-amber-300',
    title: 'Forged Aadhaar · Number Modification',
    subtitle: 'Data integrity layer tampering on printed demographic zone',
    docType: 'AADHAAR',
    docFile: 'scenario5_tampered_aadhaar_invalid_verhoeff.jpg',
    faceFile: 'presenter_rohit_matching.jpg',
    summary: 'Modified 12-digit Aadhaar number violating UIDAI dihedral D5 Verhoeff algorithm.',
    expected: 'HIGH RISK · CHECKSUM INVALID'
  },
  {
    id: 'deck_interpol_hit',
    tag: 'INTERPOL RED NOTICE HIT',
    tagColor: 'bg-red-100 text-red-800 border-red-300',
    title: 'Interpol Watchlist Persona (Rohit Sharma)',
    subtitle: 'Simulated law enforcement fugitive detection & arrest warrant',
    docType: 'PASSPORT',
    docFile: 'scenario1_genuine_indian_passport.jpg',
    faceFile: 'presenter_rohit_matching.jpg',
    summary: 'Document number P9823412 matches active CBI Interpol NCB Red Notice #2026-9041.',
    expected: 'CRITICAL (100%) · DETAIN PASSENGER'
  }
]

export default function CaptureStationPage({ onComplete, onCancel }) {
  const { lang } = useLanguage()
  const [step, setStep] = useState(1) // 1: Type, 2: Doc, 3: Face, 4: Processing
  const [docType, setDocType] = useState('AADHAAR')
  const [docImage, setDocImage] = useState(null)
  const [faceImage, setFaceImage] = useState(null)
  const [facingMode, setFacingMode] = useState('environment')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingPhase, setProcessingPhase] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const [showCalibrationModal, setShowCalibrationModal] = useState(false)
  const [loadingPresetId, setLoadingPresetId] = useState(null)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)
  const faceInputRef = useRef(null)

  const stepsList = [
    lang === 'hi' ? 'दस्तावेज़ प्रकार' : 'Document type',
    lang === 'hi' ? 'दस्तावेज़ स्कैन' : 'Scan document',
    lang === 'hi' ? 'चेहरा कैप्चर' : 'Capture face',
    lang === 'hi' ? 'सत्यापन' : 'Verification'
  ]

  // WebCam utilities
  const startCamera = async (mode) => {
    stopCamera()
    const targetMode = mode || facingMode
    try {
      const constraints = {
        video: {
          facingMode: targetMode ? { ideal: targetMode } : 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      streamRef.current = stream
      setCameraActive(true)
    } catch (e) {
      console.warn('Camera stream error:', e)
      setCameraActive(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  const takeSnapshot = (targetSetter) => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' })
        targetSetter(file)
        stopCamera()
      }
    }, 'image/jpeg', 0.95)
  }

  const handleFileUpload = (e, targetSetter) => {
    const file = e.target.files?.[0]
    if (file) {
      targetSetter(file)
      stopCamera()
    }
  }

  // Calibration deck runner
  const handleRunCalibration = async (preset) => {
    setLoadingPresetId(preset.id)
    setShowCalibrationModal(false)
    setDocType(preset.docType)

    try {
      const docRes = await fetch(`/api/static/calibration/${preset.docFile}`)
      if (!docRes.ok) throw new Error(`Calibration doc not found: ${preset.docFile}`)
      const docBlob = await docRes.blob()
      const docF = new File([docBlob], preset.docFile, { type: 'image/jpeg' })
      setDocImage(docF)

      let faceF = null
      if (preset.faceFile) {
        const faceRes = await fetch(`/api/static/calibration/${preset.faceFile}`)
        if (faceRes.ok) {
          const faceBlob = await faceRes.blob()
          faceF = new File([faceBlob], preset.faceFile, { type: 'image/jpeg' })
          setFaceImage(faceF)
        }
      }

      await executeScreening(docF, faceF, preset.docType)
    } catch (err) {
      console.error('Calibration preset error:', err)
      alert(`Calibration deck error: ${err.message}`)
    } finally {
      setLoadingPresetId(null)
    }
  }

  // Screening pipeline execution
  const executeScreening = async (docF, faceF, selectedType) => {
    setIsProcessing(true)
    setStep(4)
    stopCamera()

    const phases = [
      'Initializing optical OCR & demographic zone extraction...',
      'Computing ICAO 7-3-1 & Verhoeff dihedral D5 checksums...',
      'Executing Error Level Analysis (ELA) compression telemetry...',
      'Running 1:1 biometric facial landmark cosine correlation...',
      'Cross-referencing Interpol NCB & CBI watchlists...',
      'Sealing verdict into immutable SHA-256 blockchain ledger...'
    ]

    let phaseIdx = 0
    setProcessingPhase(phases[0])
    const phaseInterval = setInterval(() => {
      phaseIdx++
      if (phaseIdx < phases.length) {
        setProcessingPhase(phases[phaseIdx])
      }
    }, 700)

    try {
      const formData = new FormData()
      formData.append('document_type', selectedType || docType)
      formData.append('file', docF || docImage)
      if (faceF || faceImage) {
        formData.append('live_photo', faceF || faceImage)
      }

      const res = await fetch(`${API_BASE}/api/v1/verify`, {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Forensic screening request failed.')
      }

      const data = await res.json()
      clearInterval(phaseInterval)
      if (data.case_id) {
        onComplete(data.case_id)
      } else {
        throw new Error('No case identifier returned from verification engine.')
      }
    } catch (err) {
      clearInterval(phaseInterval)
      console.error('Screening execution error:', err)
      alert(`Screening error: ${err.message}`)
      setIsProcessing(false)
      setStep(1)
    }
  }

  useEffect(() => {
    return () => stopCamera()
  }, [])

  return (
    <div className="animate-fade-in-up">
      {/* Page Intro Header */}
      <PageIntro
        eyebrow={lang === 'hi' ? 'कैप्चर स्टेशन · नया सत्र' : 'Capture station · New screening'}
        title={lang === 'hi' ? 'दस्तावेज़ जांच कार्य केंद्र' : 'Automated forensic screening dock'}
        description={lang === 'hi' ? 'यात्री द्वारा प्रस्तुत दस्तावेज़ चुनें और कैप्चर करें।' : 'Position traveller credentials and live presenter biometric feed for multi-spectral arbitration.'}
      />

      {/* Calibration Quick Launcher Banner */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-[#a8bfd0] bg-[#e5eff5] px-5 py-3">
        <div className="flex items-center gap-2.5">
          <Sparkles size={16} className="text-[#155985]" />
          <span className="text-xs font-bold text-[#123f68]">
            {lang === 'hi' ? 'परीक्षण कैलिब्रेशन डेक उपलब्ध है' : 'Evaluator Calibration Test Deck'}
          </span>
          <span className="hidden sm:inline text-xs text-slate-600">
            · Load pre-configured authentic and counterfeit forensic scenarios.
          </span>
        </div>
        <button
          onClick={() => setShowCalibrationModal(true)}
          className="border border-[#155985] bg-white px-3 py-1.5 text-xs font-bold text-[#155985] hover:bg-[#155985] hover:text-white transition cursor-pointer"
        >
          {lang === 'hi' ? 'कैलिब्रेशन टेस्ट डेक खोलें' : 'Open calibration deck'}
        </button>
      </div>

      {/* Main Container */}
      <div className="panel mx-auto max-w-5xl">
        {/* StepBar matching components/portal-shell.tsx */}
        <div className="grid grid-cols-4 border-b border-[#d3dce4] bg-[#f5f7f8]">
          {stepsList.map((label, i) => (
            <div
              key={label}
              className={`flex items-center gap-2 border-r border-[#d3dce4] px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-bold ${
                i + 1 === step ? 'bg-[#e4edf3] text-[#123f68]' : 'text-slate-400'
              }`}
            >
              <span
                className={`grid size-6 sm:size-7 place-items-center rounded-full text-xs shrink-0 ${
                  i + 1 <= step ? 'bg-[#155985] text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {i + 1}
              </span>
              <span className="truncate">{label}</span>
            </div>
          ))}
        </div>

        {/* STEP 1: Select Document Type */}
        {step === 1 && (
          <div className="p-6 sm:p-8 lg:p-10">
            <h2 className="text-center text-xl sm:text-2xl font-bold text-[#123f68]">
              {lang === 'hi' ? 'दस्तावेज़ प्रकार चुनें' : 'Select document type'}
            </h2>
            <p className="mt-1 text-center text-xs sm:text-sm text-slate-600">
              {lang === 'hi' ? 'सुरक्षित कैप्चर जारी रखने के लिए दस्तावेज़ चुनें।' : 'Choose the statutory travel or identity credential to begin inspection.'}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {DOC_TYPES.map(({ id, title, desc, sub, icon: Icon }) => {
                const isSelected = docType === id
                return (
                  <button
                    key={id}
                    onClick={() => setDocType(id)}
                    className={`group flex items-start gap-4 border p-5 text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-[#155985] bg-[#e9f1f5] ring-1 ring-[#155985]'
                        : 'border-[#d3dce4] bg-white hover:border-[#155985]'
                    }`}
                  >
                    <span className="grid size-11 place-items-center bg-[#edf3f7] text-[#155985] shrink-0 rounded">
                      <Icon size={22} />
                    </span>
                    <div>
                      <b className="block text-sm sm:text-base text-[#155985]">{title}</b>
                      <span className="mt-1 block text-xs sm:text-sm text-slate-700">{desc}</span>
                      <small className="mt-1 block text-[11px] text-slate-500 font-mono">{sub}</small>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-[#e1e7ec] pt-6">
              <button
                onClick={onCancel}
                className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#155985] hover:underline cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>{lang === 'hi' ? 'डैशबोर्ड पर वापस' : 'Back to dashboard'}</span>
              </button>
              <button
                onClick={() => setStep(2)}
                className="bg-[#155985] hover:bg-[#104364] px-6 py-3 text-xs sm:text-sm font-bold text-white transition cursor-pointer flex items-center gap-1.5"
              >
                <span>{lang === 'hi' ? 'स्कैन जारी रखें' : 'Continue to scan'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Scan Document */}
        {step === 2 && (
          <div className="p-6 sm:p-8 lg:p-10 text-center">
            <div className="text-[11px] font-bold uppercase tracking-[.18em] text-[#155985]">
              {DOC_TYPES.find(d => d.id === docType)?.title} · Step 2 of 4
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-[#123f68]">
              {lang === 'hi' ? 'दस्तावेज़ स्कैन करें' : 'Scan document'}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              {lang === 'hi' ? 'दस्तावेज़ को स्पष्ट रूप से निरीक्षण फ्रेम के अंदर रखें।' : 'Position the document clearly inside the optical inspection frame.'}
            </p>

            {/* Viewfinder Area */}
            <div className="mx-auto mt-6 relative flex aspect-video max-w-2xl items-center justify-center border-2 border-dashed border-[#155985] bg-[#17232d] text-slate-300 overflow-hidden">
              {docImage ? (
                <img
                  src={URL.createObjectURL(docImage)}
                  alt="Captured Document"
                  className="size-full object-contain bg-black"
                />
              ) : cameraActive ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="size-full object-cover" />
                  <div className="scan-line" />
                </>
              ) : (
                <div className="p-6">
                  <Camera className="mx-auto mb-3 text-slate-400" size={38} />
                  <p className="text-sm font-semibold">{lang === 'hi' ? 'कैमरा पूर्वावलोकन क्षेत्र' : 'Camera preview area'}</p>
                  <p className="mt-1 text-xs text-slate-400">{lang === 'hi' ? 'दस्तावेज़ के किनारे दिखाई देने चाहिए' : 'Document edges must remain fully visible'}</p>
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, setDocImage)}
            />

            {/* Capture / Upload Controls */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {cameraActive ? (
                <button
                  onClick={() => takeSnapshot(setDocImage)}
                  className="flex items-center justify-center gap-2 bg-[#c62828] hover:bg-[#a51f1f] px-6 py-3 text-sm font-bold text-white transition cursor-pointer shadow-xs"
                >
                  <Camera size={18} />
                  <span>{lang === 'hi' ? 'फोटो लें' : 'Capture snapshot'}</span>
                </button>
              ) : (
                <button
                  onClick={() => startCamera('environment')}
                  className="flex items-center justify-center gap-2 bg-[#123f68] hover:bg-[#0b3152] px-6 py-3 text-sm font-bold text-white transition cursor-pointer shadow-xs"
                >
                  <Camera size={18} />
                  <span>{lang === 'hi' ? 'कैमरा प्रारंभ करें' : 'Start camera'}</span>
                </button>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 border border-[#a8bfd0] bg-white px-6 py-3 text-sm font-bold text-[#155985] hover:bg-[#e9f1f5] transition cursor-pointer"
              >
                <UploadCloud size={18} />
                <span>{docImage ? (lang === 'hi' ? 'फ़ाइल बदलें' : 'Replace file') : (lang === 'hi' ? 'फ़ाइल अपलोड करें' : 'Upload file')}</span>
              </button>

              {docImage && (
                <button
                  onClick={() => setDocImage(null)}
                  className="flex items-center justify-center gap-1.5 border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-bold text-[#c62828] hover:bg-rose-100 transition cursor-pointer"
                >
                  <X size={16} />
                  <span>{lang === 'hi' ? 'हटाएं' : 'Clear'}</span>
                </button>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center justify-between border-t border-[#e1e7ec] pt-6">
              <button
                onClick={() => { stopCamera(); setStep(1); }}
                className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#155985] hover:underline cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>{lang === 'hi' ? 'दस्तावेज़ प्रकार पर वापस' : 'Back to document type'}</span>
              </button>

              <button
                disabled={!docImage}
                onClick={() => { stopCamera(); setStep(3); }}
                className="bg-[#155985] hover:bg-[#104364] disabled:opacity-40 disabled:cursor-not-allowed px-6 py-3 text-xs sm:text-sm font-bold text-white transition cursor-pointer flex items-center gap-1.5"
              >
                <span>{lang === 'hi' ? 'चेहरा कैप्चर जारी रखें' : 'Continue to face capture'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Capture Face (1:1 Biometrics) */}
        {step === 3 && (
          <div className="p-6 sm:p-8 lg:p-10 text-center">
            <div className="text-[11px] font-bold uppercase tracking-[.18em] text-[#155985]">
              1:1 Biometric Verification · Step 3 of 4
            </div>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-[#123f68]">
              {lang === 'hi' ? 'यात्री का चेहरा कैप्चर करें' : 'Live presenter biometric capture'}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              {lang === 'hi' ? '1:1 चेहरे के सत्यापन के लिए लाइव फोटो कैप्चर करें या छोड़ें।' : 'Capture live portrait of traveller for 1:1 facial metric correlation against credential photo.'}
            </p>

            {/* Viewfinder */}
            <div className="mx-auto mt-6 relative flex aspect-video max-w-2xl items-center justify-center border-2 border-dashed border-[#155985] bg-[#17232d] text-slate-300 overflow-hidden">
              {faceImage ? (
                <img
                  src={URL.createObjectURL(faceImage)}
                  alt="Captured Face"
                  className="size-full object-contain bg-black"
                />
              ) : cameraActive ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="size-full object-cover" />
                  <div className="scan-line" />
                </>
              ) : (
                <div className="p-6">
                  <ScanFace className="mx-auto mb-3 text-slate-400" size={38} />
                  <p className="text-sm font-semibold">{lang === 'hi' ? 'लाइव कैमरा फ्रेम' : 'Presenter biometric frame'}</p>
                  <p className="mt-1 text-xs text-slate-400">{lang === 'hi' ? 'चेहरा फ्रेम के केंद्र में रखें' : 'Face must be centered with neutral lighting'}</p>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={faceInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, setFaceImage)}
            />

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {cameraActive ? (
                <button
                  onClick={() => takeSnapshot(setFaceImage)}
                  className="flex items-center justify-center gap-2 bg-[#c62828] hover:bg-[#a51f1f] px-6 py-3 text-sm font-bold text-white transition cursor-pointer shadow-xs"
                >
                  <Camera size={18} />
                  <span>{lang === 'hi' ? 'फोटो लें' : 'Capture portrait'}</span>
                </button>
              ) : (
                <button
                  onClick={() => startCamera('user')}
                  className="flex items-center justify-center gap-2 bg-[#123f68] hover:bg-[#0b3152] px-6 py-3 text-sm font-bold text-white transition cursor-pointer shadow-xs"
                >
                  <Camera size={18} />
                  <span>{lang === 'hi' ? 'सेल्फी कैमरा शुरू करें' : 'Start face camera'}</span>
                </button>
              )}

              <button
                onClick={() => faceInputRef.current?.click()}
                className="flex items-center justify-center gap-2 border border-[#a8bfd0] bg-white px-6 py-3 text-sm font-bold text-[#155985] hover:bg-[#e9f1f5] transition cursor-pointer"
              >
                <UploadCloud size={18} />
                <span>{faceImage ? (lang === 'hi' ? 'फोटो बदलें' : 'Replace photo') : (lang === 'hi' ? 'फोटो अपलोड करें' : 'Upload portrait')}</span>
              </button>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-[#e1e7ec] pt-6">
              <button
                onClick={() => { stopCamera(); setStep(2); }}
                className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#155985] hover:underline cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>{lang === 'hi' ? 'दस्तावेज़ स्कैन पर वापस' : 'Back to document scan'}</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => executeScreening(docImage, null, docType)}
                  className="border border-[#a8bfd0] bg-white px-4 py-3 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#123f68] transition cursor-pointer"
                >
                  <span>{lang === 'hi' ? 'चेहरा छोड़ें और सत्यापित करें' : 'Skip face & verify'}</span>
                </button>
                <button
                  onClick={() => executeScreening(docImage, faceImage, docType)}
                  className="bg-[#c62828] hover:bg-[#a51f1f] px-6 py-3 text-xs sm:text-sm font-bold text-white transition cursor-pointer flex items-center gap-2 shadow-xs"
                >
                  <ShieldAlert size={16} />
                  <span>{lang === 'hi' ? 'फोरेंसिक सत्यापन निष्पादित करें' : 'Execute forensic verification'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Processing State */}
        {step === 4 && (
          <div className="p-10 sm:p-16 text-center space-y-5">
            <div className="size-16 rounded-full bg-[#e4edf3] border-4 border-[#155985] border-t-transparent animate-spin mx-auto" />
            <div>
              <h2 className="text-2xl font-bold text-[#123f68]">
                {lang === 'hi' ? 'फोरेंसिक मध्यस्थता प्रगति पर है...' : 'Forensic arbitration in progress...'}
              </h2>
              <p className="mt-2 text-sm font-mono text-[#155985]">
                {processingPhase}
              </p>
            </div>
            <div className="mx-auto max-w-md h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#155985] animate-progress-fill" />
            </div>
          </div>
        )}
      </div>

      {/* Calibration Deck Modal */}
      {showCalibrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="panel max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#d3dce4] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#155985]" />
                <h3 className="text-lg font-bold text-[#123f68]">
                  Evaluator Calibration Test Deck
                </h3>
              </div>
              <button onClick={() => setShowCalibrationModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Select an authoritative test case to execute end-to-end multi-spectral verification:
            </p>

            <div className="space-y-3">
              {CALIBRATION_PRESETS.map((preset) => (
                <div key={preset.id} className="border border-[#d3dce4] p-4 flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center hover:bg-[#f8fafc] transition">
                  <div className="space-y-1">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold border ${preset.tagColor}`}>
                      {preset.tag}
                    </span>
                    <h4 className="font-bold text-sm text-[#123f68]">{preset.title}</h4>
                    <p className="text-xs text-slate-600">{preset.summary}</p>
                  </div>
                  <button
                    disabled={loadingPresetId === preset.id}
                    onClick={() => handleRunCalibration(preset)}
                    className="shrink-0 bg-[#155985] hover:bg-[#104364] text-white px-4 py-2 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    {loadingPresetId === preset.id ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Play size={13} />
                    )}
                    <span>Run Test</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
