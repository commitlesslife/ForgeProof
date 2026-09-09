import { useState, useRef, useCallback, useEffect } from 'react'
import { ArrowRight, ArrowLeft, Camera, Upload, CheckCircle2, FileText, ScanFace, Activity, ShieldAlert, SwitchCamera } from 'lucide-react'
import { API_BASE } from '../config'

const docTypes = [
  { id: 'AADHAAR', label: 'Aadhaar Card' },
  { id: 'PASSPORT', label: 'Passport' },
  { id: 'PAN', label: 'PAN Card' },
  { id: 'DRIVING_LICENSE', label: 'Driving License' },
  { id: 'VOTER_ID', label: 'Voter ID' }
]

export default function CaptureStationPage({ onComplete, onCancel }) {
  const [step, setStep] = useState(1) // 1: Type, 2: Doc, 3: Face, 4: Processing
  const [docType, setDocType] = useState('AADHAAR')
  const [docImage, setDocImage] = useState(null)
  const [faceImage, setFaceImage] = useState(null)
  const [facingMode, setFacingMode] = useState('environment') // 'environment' (rear) for doc, 'user' (selfie) for face
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingPhase, setProcessingPhase] = useState('')

  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // WebCam utilities with rear/front support
  const startCamera = async (mode) => {
    stopCamera()
    const targetMode = mode || facingMode
    try {
      const constraints = {
        video: {
          facingMode: targetMode ? { ideal: targetMode } : 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      streamRef.current = stream
    } catch (err) {
      console.warn("Camera exact mode failed, falling back to default:", err)
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream
        }
        streamRef.current = fallbackStream
      } catch (fallbackErr) {
        console.error("Camera access completely failed:", fallbackErr)
      }
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const toggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(nextMode)
    startCamera(nextMode)
  }

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(videoRef.current, 0, 0)
      
      canvas.toBlob((blob) => {
        const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
        const previewUrl = URL.createObjectURL(blob)
        
        if (step === 2) {
          setDocImage({ file, previewUrl })
          stopCamera()
          setStep(3)
        } else if (step === 3) {
          setFaceImage({ file, previewUrl })
          stopCamera()
          submitCase(file) // auto submit after face capture
        }
      }, 'image/jpeg', 0.9)
    }
  }

  const handleFileUpload = (e, type) => {
    const file = e.target.files?.[0]
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      if (type === 'doc') {
        setDocImage({ file, previewUrl })
        setStep(3)
      } else {
        setFaceImage({ file, previewUrl })
        submitCase(file)
      }
    }
  }

  const submitCase = async (finalFaceFile) => {
    setStep(4)
    setIsProcessing(true)
    
    // Fake progress phases for visual feedback (4-8s total)
    const phases = [
      'Extracting document metadata...',
      'Running Verhoeff/MRZ validation...',
      'Performing ELA tampering analysis...',
      'Extracting facial biometrics...',
      'Computing similarity scores...',
      'Finalizing risk assessment...'
    ]
    
    let phaseIndex = 0
    setProcessingPhase(phases[0])
    const phaseInterval = setInterval(() => {
      phaseIndex++
      if (phaseIndex < phases.length) {
        setProcessingPhase(phases[phaseIndex])
      } else {
        clearInterval(phaseInterval)
      }
    }, 1200)

    try {
      const formData = new FormData()
      formData.append('doc_type', docType)
      formData.append('doc_file', docImage.file)
      formData.append('live_file', finalFaceFile)

      const response = await fetch(`${API_BASE}/api/v1/cases/screen`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('API request failed')
      
      const data = await response.json()
      
      // Ensure we wait at least 7 seconds total for effect
      setTimeout(() => {
        clearInterval(phaseInterval)
        onComplete(data.case_id)
      }, Math.max(0, 7000 - (phaseIndex * 1200)))

    } catch (error) {
      console.error(error)
      clearInterval(phaseInterval)
      alert("Error processing case. Ensure backend is running.")
      setStep(1)
      setIsProcessing(false)
    }
  }

  // Effect to handle camera lifecycle with automatic rear/front preference
  useEffect(() => {
    if (step === 2 && !docImage) {
      const mode = 'environment'
      setFacingMode(mode)
      startCamera(mode)
    } else if (step === 3 && !faceImage) {
      const mode = 'user'
      setFacingMode(mode)
      startCamera(mode)
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [step, docImage, faceImage])


  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <button onClick={onCancel} className="mb-4 sm:mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer active:scale-95">
        <ArrowLeft size={16} /> Back to dashboard
      </button>

      <div className="glass-effect rounded-[24px] sm:rounded-[28px] overflow-hidden border border-white/70">
        {/* Progress Bar */}
        <div className="flex border-b border-[#615D73]/15">
          {[
            { num: 1, label: 'Document Type' },
            { num: 2, label: 'Scan Document' },
            { num: 3, label: 'Capture Face' },
            { num: 4, label: 'Verification' }
          ].map((s) => (
            <div key={s.num} className={`flex-1 py-3 sm:py-4 px-1 sm:px-2 text-center text-xs sm:text-sm font-semibold transition-colors ${step >= s.num ? 'text-[#0B477A] bg-[#0B477A]/5 font-bold' : 'text-[#615D73]/70'}`}>
              <span className={`inline-flex size-6 items-center justify-center rounded-full text-xs mr-1 sm:mr-2 transition-all ${step >= s.num ? 'glass-navy text-white font-bold' : 'bg-[#615D73]/15 text-[#615D73]'}`}>
                {s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="p-4 sm:p-6 md:p-10">
          {step === 1 && (
            <div className="animate-slide-in-right">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0B477A] text-center mb-6 sm:mb-8">Select Document Type</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {docTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => { setDocType(type.id); setStep(2); }}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all text-left hover-lift active:scale-98 cursor-pointer ${docType === type.id ? 'border-[#0B477A] glass-navy-subtle shadow-md ring-2 ring-[#0B477A]/25' : 'border-white/80 glass-card hover:bg-white'}`}
                  >
                    <div className="font-bold text-[#0B477A]">{type.label}</div>
                    <div className="text-xs text-[#615D73] mt-1">Official {type.label} issued by Govt.</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(step === 2 || step === 3) && (
            <div className="animate-slide-in-right text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0B477A] mb-1 sm:mb-2">
                {step === 2 ? 'Scan Document' : 'Live Face Capture'}
              </h2>
              <p className="text-xs sm:text-sm text-[#615D73] mb-5 sm:mb-8">
                {step === 2 ? 'Position the document clearly in the frame.' : 'Look directly at the camera.'}
              </p>

              <div className="relative mx-auto max-w-lg aspect-[4/3] sm:aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-white/80">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform scale-x-[-1]' : ''}`} 
                />
                {/* Overlay guides */}
                <div className="absolute inset-0 border-2 border-dashed border-[#0B477A]/90 m-4 sm:m-8 rounded-xl pointer-events-none shadow-[0_0_24px_rgba(11,71,122,0.35)]" />

                {/* Mobile Camera Flip Button */}
                <button
                  type="button"
                  onClick={toggleCamera}
                  className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/65 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white border border-white/30 hover:bg-black/80 transition active:scale-95 cursor-pointer shadow-lg"
                  title="Switch between front and rear cameras"
                >
                  <SwitchCamera size={14} className="text-white" />
                  <span className="text-[11px]">{facingMode === 'environment' ? 'Rear' : 'Front'}</span>
                </button>
              </div>

              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 max-w-sm sm:max-w-none mx-auto">
                <button
                  onClick={captureImage}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#D30B0D] hover:bg-[#B3090B] px-6 py-3.5 sm:py-3 font-bold text-white transition hover:-translate-y-0.5 active:scale-98 cursor-pointer shadow-md shadow-[#D30B0D]/25"
                >
                  <Camera size={20} /> Capture Now
                </button>
                
                <div className="relative w-full sm:w-auto">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, step === 2 ? 'doc' : 'face')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button className="w-full flex items-center justify-center gap-2 rounded-xl glass-card px-6 py-3.5 sm:py-3 font-bold text-[#0B477A] transition hover:bg-white border border-white/80 cursor-pointer shadow-xs active:scale-98">
                    <Upload size={20} /> Upload File
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="py-12 text-center">
              <div className="relative mx-auto size-32 mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-[#615D73]/15" />
                <div className="absolute inset-0 rounded-full border-4 border-[#0B477A] border-t-transparent animate-spin shadow-[0_0_20px_rgba(11,71,122,0.35)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity size={40} className="text-[#D30B0D] animate-pulse-soft" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-[#0B477A] mb-2">AI Verification in Progress</h2>
              <p className="text-[#0B477A] font-semibold animate-pulse">{processingPhase}</p>
              
              <div className="mt-10 max-w-md mx-auto space-y-4 text-left">
                {[
                  { icon: FileText, label: 'Document Integrity' },
                  { icon: ScanFace, label: 'Biometric Matching' },
                  { icon: ShieldAlert, label: 'Tamper Detection' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl glass-card border border-white/80 shadow-xs">
                    <item.icon size={20} className="text-[#0B477A]" />
                    <span className="font-semibold text-[#0B477A]">{item.label}</span>
                    <div className="ml-auto flex-1 max-w-[100px] h-2 bg-[#615D73]/15 rounded-full overflow-hidden">
                      <div className="h-full bg-[#D30B0D] animate-progress-fill" style={{ animationDelay: `${i * 0.8}s` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
