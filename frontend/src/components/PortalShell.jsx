import { useState, useEffect } from 'react'
import {
  Bell,
  ClipboardList,
  FileSearch,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  ScanLine,
  UserCheck,
  MapPin,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Activity,
  Radio,
  Clock,
  Globe2,
  ChevronRight,
  CheckCircle2,
  Lock,
  Cpu,
  ShieldAlert,
  HelpCircle,
  PhoneCall,
  ExternalLink
} from 'lucide-react'
import { isAudioMuted, setAudioMuted } from '../utils/audioAlerts'
import { useLanguage } from '../utils/LanguageContext'
import { ForgeProofLogo, ForgeProofEmblem } from './ForgeProofLogo'

export default function PortalShell({ children, activePage, onNavigate, officer, onLogout }) {
  const { lang, setLang, t } = useLanguage()
  const [isDarkBooth, setIsDarkBooth] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('forgeproof_dark_booth') === 'true'
  })
  const [isMuted, setIsMutedState] = useState(() => isAudioMuted())
  const [currentTime, setCurrentTime] = useState(new Date())
  const [fontSize, setFontSize] = useState('normal') // normal | large | xlarge

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (isDarkBooth) {
      document.body.classList.add('dark-booth')
    } else {
      document.body.classList.remove('dark-booth')
    }
  }, [isDarkBooth])

  const toggleDarkBooth = () => {
    const next = !isDarkBooth
    setIsDarkBooth(next)
    localStorage.setItem('forgeproof_dark_booth', next ? 'true' : 'false')
  }

  const toggleAudio = () => {
    const next = !isMuted
    setIsMutedState(next)
    setAudioMuted(next)
  }

  const officerName = officer?.full_name || officer?.officer_id || 'Inspector Rajesh Kumar'
  const dutyStation = officer?.duty_station || 'ICP Raxaul (SSB Frontier)'
  const badgeNo = officer?.badge_number || officer?.officer_id || 'IND-SSB-8294'
  const clearanceLevel = officer?.clearance_level || 'LEVEL_3_SUPERVISOR'

  // Time formatters with tabular figures
  const localTimeStr = currentTime.toLocaleTimeString('en-IN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  const utcHours = String(currentTime.getUTCHours()).padStart(2, '0')
  const utcMins = String(currentTime.getUTCMinutes()).padStart(2, '0')
  const utcSecs = String(currentTime.getUTCSeconds()).padStart(2, '0')
  const utcTimeStr = `${utcHours}:${utcMins}:${utcSecs} Z`

  const dateStr = currentTime.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

  const navLinks = [
    { id: 'overview', label: t('overview'), icon: LayoutDashboard },
    { id: 'capture', label: t('capture'), icon: ScanLine },
    { id: 'audit', label: t('audit'), icon: FileSearch },
    { id: 'readiness', label: t('readiness'), icon: Activity },
    { id: 'advisories', label: t('advisories'), icon: Radio },
  ]

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-150 ${isDarkBooth ? 'bg-[#091220] text-slate-100' : 'bg-[#F4F6F9] text-[#1E293B]'} selection:bg-[#003366] selection:text-white ${fontSize === 'large' ? 'text-base' : fontSize === 'xlarge' ? 'text-lg' : 'text-sm'}`}>
      
      {/* 1. National Tricolor Micro-Stripe */}
      <div className="tricolor-stripe" />

      {/* 2. Official Indian Government Top Utility Masthead */}
      <header className="w-full bg-[#08213D] text-slate-200 border-b border-slate-700/70">
        <div className="mx-auto max-w-[1560px] px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Left: Official Government Authority Tags */}
          <div className="flex items-center gap-2.5">
            <span className="text-sm">🇮🇳</span>
            <div className="flex flex-wrap items-center gap-2 font-semibold text-[11px] tracking-wide uppercase text-slate-300">
              <span className="font-extrabold text-white">{lang === 'hi' ? 'भारत सरकार' : 'GOVERNMENT OF INDIA'}</span>
              <span className="text-slate-500">|</span>
              <span className="hidden sm:inline text-slate-300">{lang === 'hi' ? 'गृह मंत्रालय (पुलिस II प्रभाग)' : 'MINISTRY OF HOME AFFAIRS (POLICE II DIVISION)'}</span>
              <span className="text-slate-500 hidden sm:inline">|</span>
              <span className="text-amber-400 font-extrabold hidden md:inline">{lang === 'hi' ? 'सशस्त्र सीमा बल (एसएसबी)' : 'SASHASTRA SEEMA BAL (SSB)'}</span>
            </div>
          </div>

          {/* Right: Dual Clocks, Language, Accessibility & Telemetry */}
          <div className="flex items-center gap-3 text-[11px] font-mono">
            
            {/* Dual Time Display */}
            <div className="hidden lg:flex items-center gap-3 bg-black/35 px-3 py-1 rounded-md border border-white/10 text-slate-300">
              <span className="flex items-center gap-1.5">
                <Clock size={12} className="text-amber-400" />
                <span className="text-slate-400">IST:</span>
                <strong className="text-white font-bold font-mono">{localTimeStr}</strong>
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1.5">
                <Globe2 size={12} className="text-emerald-400" />
                <span className="text-slate-400">ICAO ZULU:</span>
                <strong className="text-emerald-300 font-bold font-mono">{utcTimeStr}</strong>
              </span>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-900/90 rounded-md border border-slate-700 p-0.5 text-[10px] font-bold font-sans">
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-0.5 rounded transition cursor-pointer ${lang === 'en' ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'text-slate-300 hover:text-white'}`}
                title="Switch interface to English"
              >
                English
              </button>
              <button
                onClick={() => setLang('hi')}
                className={`px-2.5 py-0.5 rounded transition cursor-pointer ${lang === 'hi' ? 'bg-amber-400 text-slate-950 font-black shadow-xs' : 'text-slate-300 hover:text-white'}`}
                title="इंटरफ़ेस को हिन्दी में बदलें"
              >
                हिन्दी
              </button>
            </div>

            {/* Accessibility: Font Size Adjuster */}
            <div className="hidden sm:flex items-center border border-slate-700 rounded-md overflow-hidden text-[10px] font-bold font-sans">
              <button 
                onClick={() => setFontSize('normal')} 
                className={`px-2 py-0.5 ${fontSize === 'normal' ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
                title="Normal Font Size"
              >
                A-
              </button>
              <button 
                onClick={() => setFontSize('large')} 
                className={`px-2 py-0.5 ${fontSize === 'large' ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
                title="Medium Font Size"
              >
                A
              </button>
              <button 
                onClick={() => setFontSize('xlarge')} 
                className={`px-2 py-0.5 ${fontSize === 'xlarge' ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'}`}
                title="Large Font Size"
              >
                A+
              </button>
            </div>

            {/* Tactical Audio Alert Toggle */}
            <button
              onClick={toggleAudio}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition cursor-pointer text-[10px] font-sans font-bold ${
                isMuted 
                  ? 'border-rose-400/80 bg-rose-950/60 text-rose-300' 
                  : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
              }`}
              title={isMuted ? 'Audio alerts are MUTED' : 'Audio alerts are ACTIVE'}
            >
              {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} className="text-emerald-400" />}
              <span className="hidden md:inline">{isMuted ? t('muted') : t('audio_on')}</span>
            </button>

            {/* Night Booth Inspection Mode Toggle */}
            <button
              onClick={toggleDarkBooth}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition cursor-pointer text-[10px] font-sans font-bold ${
                isDarkBooth 
                  ? 'border-amber-400 bg-amber-950/60 text-amber-300' 
                  : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
              }`}
              title="Toggle Low-Glare Night Booth Mode for low-light border stations"
            >
              {isDarkBooth ? <Sun size={12} /> : <Moon size={12} />}
              <span className="hidden md:inline">{isDarkBooth ? t('day_mode') : t('dark_booth')}</span>
            </button>

          </div>
        </div>
      </header>

      {/* 3. Main Government Portal Banner & Officer Masthead */}
      <div className={`w-full transition-colors duration-150 border-b-2 shadow-xs ${isDarkBooth ? 'bg-[#0B1728] border-b-[#003366]' : 'bg-white border-b-[#003366]'}`}>
        <div className="mx-auto max-w-[1560px] px-4 sm:px-6 py-3.5 sm:py-4 flex flex-wrap items-center justify-between gap-4">
          
          {/* Left: Official Emblem & Department Hierarchy */}
          <div className="flex items-center gap-3.5 sm:gap-5">
            <ForgeProofEmblem className="h-14 sm:h-16 w-auto shrink-0 drop-shadow-xs" />
            
            <div className={`border-l-2 pl-3.5 sm:pl-4 space-y-0.5 ${isDarkBooth ? 'border-slate-700' : 'border-slate-200'}`}>
              <p className={`text-[11px] sm:text-xs font-extrabold tracking-wide leading-tight uppercase ${isDarkBooth ? 'text-amber-400' : 'text-[#003366]'}`}>
                {lang === 'hi' ? 'भारत सरकार · गृह मंत्रालय' : 'GOVERNMENT OF INDIA · MINISTRY OF HOME AFFAIRS'}
              </p>
              <h2 className={`text-sm sm:text-base font-extrabold tracking-tight leading-snug ${isDarkBooth ? 'text-white' : 'text-[#003366]'}`}>
                {lang === 'hi' ? 'सशस्त्र सीमा बल (एसएसबी) — सीमा नियंत्रण एवं दस्तावेज़ सत्यापन निदेशालय' : 'SASHASTRA SEEMA BAL (SSB) — BORDER & DOCUMENT SCREENING DIRECTORATE'}
              </h2>
              <div className={`flex flex-wrap items-center gap-2 pt-0.5 text-xs font-medium ${isDarkBooth ? 'text-slate-400' : 'text-slate-600'}`}>
                <ForgeProofLogo className="h-3.5 sm:h-4 w-auto shrink-0" />
                <span className={isDarkBooth ? 'text-slate-600 hidden sm:inline' : 'text-slate-300 hidden sm:inline'}>|</span>
                <span className={`text-[11px] hidden sm:inline font-mono ${isDarkBooth ? 'text-slate-400' : 'text-slate-500'}`}>
                  SIH26188 · MULTI-PILLAR FORENSIC & BIOMETRIC VERIFICATION TERMINAL
                </span>
              </div>
            </div>
          </div>

          {/* Right: Authenticated Officer Identity Card (Generously Spaced) */}
          <div className={`flex items-center gap-3.5 rounded-2xl p-3 sm:p-3.5 shadow-xs border transition-colors ${isDarkBooth ? 'bg-[#0F1E33] border-[#1E3555]' : 'bg-slate-50/90 border-slate-200/90'}`}>
            <div className="size-11 rounded-xl bg-[#003366] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              {officerName.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('') || 'OI'}
            </div>
            
            <div className="min-w-0 pr-1 text-left space-y-0.5">
              <div className="flex items-center gap-2">
                <p className={`font-extrabold text-xs sm:text-sm truncate ${isDarkBooth ? 'text-white' : 'text-[#003366]'}`}>{officerName.toUpperCase()}</p>
                <span className="size-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" title="Active On Duty" />
              </div>
              <p className={`text-[11px] font-mono font-semibold truncate ${isDarkBooth ? 'text-slate-300' : 'text-slate-600'}`}>
                BADGE: <strong className={isDarkBooth ? 'text-amber-300' : 'text-slate-900'}>{badgeNo}</strong> · {clearanceLevel.replace('LEVEL_', 'LVL ').replace(/_/g, ' ')}
              </p>
              <p className={`text-[11px] font-medium truncate flex items-center gap-1 ${isDarkBooth ? 'text-slate-400' : 'text-slate-500'}`}>
                <MapPin size={11} className="text-slate-400 shrink-0" /> {dutyStation}
              </p>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="ml-2 flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[#D30B0D] px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-2xs"
              title="Sign Out Session"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">{t('sign_out')}</span>
            </button>
          </div>

        </div>
      </div>

      {/* 4. Full-Width Official Government Navigation Bar */}
      <nav className={`w-full text-white shadow-md sticky top-0 z-40 border-b transition-colors ${isDarkBooth ? 'bg-[#061527] border-[#0A223E]' : 'bg-[#003366] border-[#002244]'}`}>
        <div className="mx-auto max-w-[1560px] px-3 sm:px-6 flex items-center justify-between overflow-x-auto no-scrollbar">
          
          {/* Main Navigation Links with generous padding and readable text */}
          <div className="flex items-center">
            {navLinks.map(({ id, label, icon: Icon }) => {
              const active = activePage === id
              return (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  className={`flex items-center gap-2.5 px-5 sm:px-6 py-3.5 text-xs sm:text-sm font-bold border-r border-[#002244] transition-all whitespace-nowrap cursor-pointer ${
                    active 
                      ? 'bg-[#002244] text-amber-400 border-b-4 border-b-amber-400 shadow-inner' 
                      : 'text-slate-200 hover:bg-[#002850] hover:text-white border-b-4 border-b-transparent'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-amber-400' : 'text-slate-300'} />
                  <span>{label}</span>
                </button>
              )
            })}
          </div>

          {/* Right Status Badge */}
          <div className="hidden lg:flex items-center gap-2.5 text-xs font-mono text-slate-200 pr-2">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold tracking-wide">NIC SECURE INTRANET · {dateStr}</span>
          </div>

        </div>
      </nav>

      {/* 5. Government Breadcrumbs & Security Telemetry Bar */}
      <div className={`w-full border-b text-xs py-2 px-4 sm:px-6 transition-colors ${isDarkBooth ? 'bg-[#0A1626] border-slate-800 text-slate-300' : 'bg-[#E8EDF4] border-slate-300/80 text-slate-600'}`}>
        <div className="mx-auto max-w-[1560px] flex items-center justify-between gap-4">
          
          {/* Breadcrumb path */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium">
            <span className={`font-bold ${isDarkBooth ? 'text-amber-400' : 'text-[#003366]'}`}>{t('home')}</span>
            <ChevronRight size={12} className="text-slate-400" />
            <span className={isDarkBooth ? 'text-slate-300' : 'text-slate-700'}>{t('border_desk')}</span>
            <ChevronRight size={12} className="text-slate-400" />
            <span className={`font-extrabold uppercase ${isDarkBooth ? 'text-white' : 'text-[#003366]'}`}>
              {navLinks.find(n => n.id === activePage)?.label || 'Screening'}
            </span>
          </div>
          
          {/* Telemetry Chips */}
          <div className="hidden sm:flex items-center gap-3.5 text-[10px] font-mono font-semibold">
            <span className="flex items-center gap-1.5">
              <Lock size={11} className={isDarkBooth ? 'text-emerald-400' : 'text-emerald-700'} />
              <span className={isDarkBooth ? 'text-slate-300' : 'text-slate-600'}>SHA-256 LEDGER ACTIVE</span>
            </span>
            <span className="text-slate-400">|</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={11} className={isDarkBooth ? 'text-blue-400' : 'text-blue-700'} />
              <span className={isDarkBooth ? 'text-slate-300' : 'text-slate-600'}>DPDP ACT 2023 COMPLIANT</span>
            </span>
            <span className="text-slate-400">|</span>
            <span className={isDarkBooth ? 'text-slate-300' : 'text-slate-600'}>STATION: <strong className={isDarkBooth ? 'text-white' : 'text-slate-900'}>ICP-RXL-GATE-01</strong></span>
          </div>

        </div>
      </div>

      {/* 6. Main Operational Content Surface */}
      <main className="flex-1 w-full mx-auto max-w-[1560px] p-4 sm:p-6 md:p-8">
        {children}
      </main>

      {/* 7. Official Indian Government Portal Footer */}
      <footer className="w-full bg-[#0A1A2E] text-slate-300 text-xs border-t-4 border-[#003366] mt-auto">
        <div className="mx-auto max-w-[1560px] px-4 sm:px-6 py-8 grid grid-cols-1 md:grid-cols-4 gap-6 border-b border-slate-700/80">
          
          {/* Col 1: Government Authority */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🇮🇳</span>
              <p className="font-extrabold text-white text-xs uppercase tracking-wide">
                GOVERNMENT OF INDIA · भारत सरकार
              </p>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Ministry of Home Affairs (MHA) · Police II Division
              <br />
              Sashastra Seema Bal (SSB) Border Control & Document Directorate
            </p>
            <p className="text-[10px] text-slate-500 font-mono pt-1">
              Smart India Hackathon 2026 · Problem Statement SIH26188
            </p>
          </div>

          {/* Col 2: Statutory & Forensic Standards */}
          <div className="space-y-1.5">
            <p className="font-bold text-white text-xs uppercase tracking-wider text-amber-400">
              Statutory Compliance
            </p>
            <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
              <li>• Section 65B, Indian Evidence Act (1872)</li>
              <li>• Digital Personal Data Protection Act (2023)</li>
              <li>• ICAO Doc 9303 Machine Readable Travel Docs</li>
              <li>• ISO/IEC 30107-3 Presentation Attack Detection</li>
            </ul>
          </div>

          {/* Col 3: SSB Checkpoint Network */}
          <div className="space-y-1.5">
            <p className="font-bold text-white text-xs uppercase tracking-wider text-amber-400">
              Integrated Checkposts
            </p>
            <ul className="text-[11px] text-slate-400 space-y-1">
              <li>• ICP Raxaul (Indo-Nepal Border, Bihar)</li>
              <li>• ICP Jogbani (Indo-Nepal Border, Bihar)</li>
              <li>• ICP Petrapole (Indo-Bangladesh Border, WB)</li>
              <li>• DEL T3 International Airport Security Desk</li>
            </ul>
          </div>

          {/* Col 4: NIC & Border Assistance Desk */}
          <div className="space-y-2">
            <p className="font-bold text-white text-xs uppercase tracking-wider text-amber-400">
              Technical Assistance
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              National Informatics Centre (NIC) Border Grid Helpline:
              <br />
              <strong className="text-white font-mono">1800-11-8294</strong> (Toll Free · 24x7)
            </p>
            <div className="pt-1">
              <span className="inline-block px-2.5 py-1 rounded bg-slate-800 text-[10px] font-mono font-bold text-emerald-400 border border-slate-700">
                ● ALL LOCAL AI ENGINES OPERATIONAL (OFFLINE)
              </span>
            </div>
          </div>

        </div>

        {/* Bottom Copyright & Disclaimer */}
        <div className="mx-auto max-w-[1560px] px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 font-medium">
          <p>
            © 2026 Government of India · Ministry of Home Affairs · All Rights Reserved
          </p>
          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono">
            <span>TERMS OF SCREENING</span>
            <span>·</span>
            <span>DATA PRIVACY</span>
            <span>·</span>
            <span>SECURITY AUDIT</span>
            <span>·</span>
            <span className="text-white font-bold">FORGEPROOF V2.6 PROD</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
