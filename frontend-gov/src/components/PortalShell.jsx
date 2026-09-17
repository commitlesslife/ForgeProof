import { useState, useEffect } from 'react'
import { Bell, ClipboardList, FileSearch, LayoutDashboard, LogOut, ShieldCheck, ScanLine, UserCheck, MapPin, Moon, Sun, Volume2, VolumeX, Activity, Radio, Clock, Globe2, ChevronDown, CheckCircle2, ShieldAlert } from 'lucide-react'
import { isAudioMuted, setAudioMuted } from '../utils/audioAlerts'
import { useLanguage } from '../utils/LanguageContext'

export function PageIntro({ eyebrow, title, description }) {
  return (
    <div className="mb-7 border-b border-[#ccd6df] pb-6">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-[#155985]">
        {eyebrow}
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#123f68]">
        {title}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {description}
      </p>
    </div>
  )
}

export function Footer() {
  const { lang, t } = useLanguage()
  return (
    <footer className="mt-10 flex flex-col justify-between gap-3 border-t border-[#ccd6df] pt-5 pb-6 text-[11px] text-slate-500 sm:flex-row sm:items-center">
      <div>
        <strong>ForgeProof Border Screening System</strong> · {lang === 'hi' ? 'केवल अधिकृत कर्मियों के लिए' : 'Authorized Law Enforcement Personnel Only'}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span>Classification: Official Use</span>
        <span>·</span>
        <span>SHA-256 Audit Logging Enabled</span>
        <span>·</span>
        <span>DPDP Act 2023 Compliant</span>
      </div>
    </footer>
  )
}

export default function PortalShell({ children, activePage, onNavigate, officer, onLogout }) {
  const { lang, setLang, t } = useLanguage()
  const [isDarkBooth, setIsDarkBooth] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('forgeproof_dark_booth') === 'true'
  })
  const [isMuted, setIsMutedState] = useState(() => isAudioMuted())
  const [currentTime, setCurrentTime] = useState(new Date())
  const [fontSize, setFontSize] = useState('normal')

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

  const officerName = officer?.full_name || officer?.officer_id || 'Inspector Rajesh K. Verma'
  const dutyStation = officer?.duty_station || 'Terminal-3, IGI Airport (DEL)'
  const badgeNo = officer?.badge_number || officer?.officer_id || 'IND-BOI-8294'
  const rank = officer?.rank || 'Senior Immigration Inspector'

  // Time formatters
  const localTimeStr = currentTime.toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const utcHours = String(currentTime.getUTCHours()).padStart(2, '0')
  const utcMins = String(currentTime.getUTCMinutes()).padStart(2, '0')
  const utcSecs = String(currentTime.getUTCSeconds()).padStart(2, '0')
  const utcTimeStr = `${utcHours}:${utcMins}:${utcSecs} Z`

  const navLinks = [
    { id: 'overview', label: lang === 'hi' ? 'डैशबोर्ड' : 'Overview', icon: LayoutDashboard },
    { id: 'capture', label: lang === 'hi' ? 'दस्तावेज़ जांच' : 'Capture station', icon: ScanLine },
    { id: 'audit', label: lang === 'hi' ? 'ऑडिट इतिहास' : 'Audit history', icon: FileSearch },
    { id: 'readiness', label: lang === 'hi' ? 'सिस्टम तत्परता' : 'System readiness', icon: Activity },
    { id: 'advisories', label: lang === 'hi' ? 'सक्रिय एडवाइजरी' : 'Active advisories', icon: Radio },
  ]

  const initials = officerName.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('') || 'RV'

  return (
    <div className={`min-h-screen flex flex-col bg-[#eef3f7] text-[#1f3347] ${fontSize === 'large' ? 'text-base' : fontSize === 'xlarge' ? 'text-lg' : 'text-sm'}`}>
      
      {/* 1. National Tricolor Top Stripe */}
      <div className="tricolor-stripe" />

      {/* 2. Official Utility Bar */}
      <div className="w-full bg-[#0a233a] text-slate-300 text-xs border-b border-[#183955]">
        <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-10 py-1.5 flex flex-wrap items-center justify-between gap-3">
          
          {/* Authority Label */}
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-blue-100">
            <span className="font-bold text-white">
              {lang === 'hi' ? 'भारत सरकार · गृह मंत्रालय' : 'GOVERNMENT OF INDIA · MINISTRY OF HOME AFFAIRS'}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-400 font-extrabold hidden md:inline">
              {lang === 'hi' ? 'आव्रजन ब्यूरो' : 'BUREAU OF IMMIGRATION'}
            </span>
          </div>

          {/* Clocks, Language, Audio, Booth Controls */}
          <div className="flex items-center gap-3 text-[11px] font-mono">
            {/* Dual Clocks */}
            <div className="hidden lg:flex items-center gap-3 bg-black/25 px-2.5 py-0.5 rounded border border-white/10 text-slate-300">
              <span className="flex items-center gap-1.5">
                <Clock size={12} className="text-amber-400" />
                <span className="text-slate-400">IST:</span>
                <strong className="text-white font-bold">{localTimeStr}</strong>
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1.5">
                <Globe2 size={12} className="text-emerald-400" />
                <span className="text-slate-400">ICAO ZULU:</span>
                <strong className="text-emerald-300 font-bold">{utcTimeStr}</strong>
              </span>
            </div>

            {/* Language Switcher: English (Default) | हिन्दी */}
            <div className="flex items-center bg-[#071929] rounded border border-slate-700 p-0.5 text-[10px] font-bold font-sans">
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${lang === 'en' ? 'bg-[#f0b429] text-slate-950 font-black' : 'text-slate-300 hover:text-white'}`}
                title="Switch interface to English (Default)"
              >
                English
              </button>
              <button
                onClick={() => setLang('hi')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${lang === 'hi' ? 'bg-[#f0b429] text-slate-950 font-black' : 'text-slate-300 hover:text-white'}`}
                title="Switch interface to Hindi"
              >
                हिन्दी
              </button>
            </div>

            {/* Accessibility: Font Size Adjuster */}
            <div className="hidden sm:flex items-center border border-slate-700 rounded overflow-hidden text-[10px] font-bold">
              <button 
                onClick={() => setFontSize('normal')} 
                className={`px-1.5 py-0.5 ${fontSize === 'normal' ? 'bg-[#f0b429] text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                title="Normal Font Size"
              >
                A-
              </button>
              <button 
                onClick={() => setFontSize('large')} 
                className={`px-1.5 py-0.5 ${fontSize === 'large' ? 'bg-[#f0b429] text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                title="Medium Font Size"
              >
                A
              </button>
              <button 
                onClick={() => setFontSize('xlarge')} 
                className={`px-1.5 py-0.5 ${fontSize === 'xlarge' ? 'bg-[#f0b429] text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                title="Large Font Size"
              >
                A+
              </button>
            </div>

            {/* Tactical Audio Alert Toggle */}
            <button
              onClick={toggleAudio}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border transition cursor-pointer text-[10px] font-sans font-bold ${
                isMuted 
                  ? 'border-rose-400 bg-rose-950/60 text-rose-300' 
                  : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title={isMuted ? "Audio alerts are MUTED" : "Audio alerts are ACTIVE"}
            >
              {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} className="text-emerald-400" />}
              <span className="hidden md:inline">{isMuted ? 'Muted' : 'Audio On'}</span>
            </button>

            {/* Night Booth Inspection Mode */}
            <button
              onClick={toggleDarkBooth}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border transition cursor-pointer text-[10px] font-sans font-bold ${
                isDarkBooth 
                  ? 'border-amber-400 bg-amber-950/60 text-amber-300' 
                  : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
              title="Toggle Dark Booth Mode"
            >
              {isDarkBooth ? <Sun size={12} /> : <Moon size={12} />}
              <span className="hidden md:inline">{isDarkBooth ? 'Day Mode' : 'Dark Booth'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Header (Design System from components/portal-shell.tsx) */}
      <header className="border-b-4 border-[#c9922e] bg-[#123f68] text-white shadow-sm">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-5 px-4 sm:px-6 lg:px-10 py-3">
          
          {/* Logo Brand Block (No Ashoka symbol as requested) */}
          <button onClick={() => onNavigate('overview')} className="flex items-center gap-3 cursor-pointer text-left">
            <span className="grid size-10 place-items-center border border-white/25 bg-[#0b3152] rounded">
              <ShieldCheck size={22} className="text-white" />
            </span>
            <span>
              <strong className="block text-[17px] tracking-tight font-bold text-white">ForgeProof</strong>
              <small className="block text-[9px] font-bold uppercase tracking-[.16em] text-blue-100">
                {lang === 'hi' ? 'सीमा सत्यापन प्रणाली' : 'Border verification'}
              </small>
            </span>
          </button>

          {/* Center Command Label */}
          <div className="hidden items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-blue-100 md:flex">
            National Border Operations Command Center · ICP Terminal 3
          </div>

          {/* Officer Details & Logout */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden text-right sm:block">
              <strong className="block text-xs text-white">{officerName}</strong>
              <small className="text-[10px] text-blue-100">{rank} · {badgeNo}</small>
            </div>
            <span className="grid size-9 place-items-center rounded-full bg-white/10 text-xs font-bold text-white border border-white/20">
              {initials}
            </span>
            <button
              onClick={onLogout}
              aria-label="Sign Out"
              title="Sign Out Session"
              className="border-l border-white/20 pl-3 sm:pl-4 text-blue-100 hover:text-white transition cursor-pointer flex items-center gap-1"
            >
              <LogOut size={16} />
              <span className="text-xs hidden md:inline">{lang === 'hi' ? 'लॉग आउट' : 'Sign Out'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav aria-label="Primary navigation" className="mx-auto flex max-w-[1480px] gap-1 overflow-x-auto px-4 sm:px-6 lg:px-10 no-scrollbar">
          {navLinks.map(({ id, label, icon: Icon }) => {
            const active = activePage === id
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`flex items-center gap-2 border-b-4 px-4 py-3 text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                  active 
                    ? 'border-[#f0b429] bg-white/10 text-white font-bold' 
                    : 'border-transparent text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={17} />
                <span>{label}</span>
              </button>
            )
          })}
        </nav>
      </header>

      {/* 4. Main Surface Content */}
      <main className="mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-10 py-7 lg:py-9 flex-1">
        {children}
      </main>

      {/* 5. Footer */}
      <div className="mx-auto w-full max-w-[1480px] px-4 sm:px-6 lg:px-10">
        <Footer />
      </div>

    </div>
  )
}
