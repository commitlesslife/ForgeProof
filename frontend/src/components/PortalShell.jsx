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
  Cpu
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

  const navLinks = [
    { id: 'overview', label: t('overview'), icon: LayoutDashboard },
    { id: 'capture', label: t('capture'), icon: ScanLine },
    { id: 'audit', label: t('audit'), icon: FileSearch },
    { id: 'readiness', label: t('readiness'), icon: Activity },
    { id: 'advisories', label: t('advisories'), icon: Radio },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] selection:bg-blue-600 selection:text-white">
      {/* 1. Sleek Command Header Bar */}
      <header className="w-full bg-[#0B0F17] text-white border-b border-slate-800/80 sticky top-0 z-50 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-[1560px] px-4 py-2.5 flex items-center justify-between gap-4">
          
          {/* Left: Modern Defense Brand & Terminal Badge */}
          <div className="flex items-center gap-3.5">
            <ForgeProofEmblem className="h-9 w-auto shrink-0 drop-shadow-sm" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                  FORGEPROOF
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  DEFENSE AI
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-400 truncate flex items-center gap-1.5">
                <span>SSB BORDER TERMINAL</span>
                <span className="size-1 rounded-full bg-slate-600" />
                <span className="text-emerald-400 font-mono flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ONLINE
                </span>
              </p>
            </div>
          </div>

          {/* Center: Clean Nav Pills */}
          <nav className="hidden lg:flex items-center bg-slate-900/80 p-1 rounded-lg border border-slate-800">
            {navLinks.map(({ id, label, icon: Icon }) => {
              const active = activePage === id
              return (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon size={14} className={active ? 'text-white' : 'text-slate-400'} />
                  <span>{label}</span>
                </button>
              )
            })}
          </nav>

          {/* Right: Telemetry, Clocks, Mode Controls & Officer Chip */}
          <div className="flex items-center gap-2.5 text-xs">
            
            {/* Dual Time Pill */}
            <div className="hidden xl:flex items-center gap-3 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-800 font-mono text-[11px] text-slate-300">
              <span className="flex items-center gap-1">
                <Clock size={11} className="text-slate-400" />
                <span className="text-slate-400">IST:</span>
                <strong className="text-white font-semibold font-mono-tabular">{localTimeStr}</strong>
              </span>
              <span className="text-slate-700">|</span>
              <span className="flex items-center gap-1">
                <Globe2 size={11} className="text-blue-400" />
                <span className="text-slate-400">ZULU:</span>
                <strong className="text-blue-300 font-semibold font-mono-tabular">{utcTimeStr}</strong>
              </span>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-900 rounded-md border border-slate-800 p-0.5 text-[10px] font-bold">
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${lang === 'en' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('hi')}
                className={`px-2 py-0.5 rounded transition cursor-pointer ${lang === 'hi' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                HI
              </button>
            </div>

            {/* Audio Alert Toggle */}
            <button
              onClick={toggleAudio}
              className={`p-1.5 rounded-md border transition cursor-pointer ${
                isMuted
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
              title={isMuted ? 'Audio alerts are muted' : 'Audio alerts are active'}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} className="text-emerald-400" />}
            </button>

            {/* Dark Booth Inspection Mode Toggle */}
            <button
              onClick={toggleDarkBooth}
              className={`p-1.5 rounded-md border transition cursor-pointer ${
                isDarkBooth
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
              title={isDarkBooth ? 'Switch to Standard Day Mode' : 'Switch to Low-Glare Dark Booth Mode'}
            >
              {isDarkBooth ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Duty Officer Profile Chip */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
              <div className="size-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {officerName.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('') || 'OI'}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <p className="font-semibold text-xs text-white truncate max-w-[120px]">{officerName}</p>
                <p className="text-[10px] font-mono text-slate-400 truncate">BADGE: {badgeNo}</p>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="p-1.5 rounded-md bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-800 transition cursor-pointer"
                title="Sign Out Session"
              >
                <LogOut size={13} />
              </button>
            </div>

          </div>

        </div>

        {/* Mobile Navigation Sub-Bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto no-scrollbar px-3 py-1.5 border-t border-slate-800/80 bg-slate-950">
          {navLinks.map(({ id, label, icon: Icon }) => {
            const active = activePage === id
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={13} />
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </header>

      {/* 2. Sleek Telemetry & Breadcrumb Ribbon */}
      <div className="w-full bg-white border-b border-slate-200 text-xs text-slate-600 py-1.5 px-4 sm:px-6 shadow-2xs">
        <div className="mx-auto max-w-[1560px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <span className="font-semibold text-slate-800">{t('border_desk')}</span>
            <ChevronRight size={12} className="text-slate-400" />
            <span className="font-bold text-blue-600 uppercase">
              {navLinks.find(n => n.id === activePage)?.label || 'Screening'}
            </span>
          </div>
          
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono text-slate-500">
            <span className="flex items-center gap-1">
              <Lock size={10} className="text-emerald-600" />
              <span>SHA-256 LEDGER ACTIVE</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={10} className="text-blue-600" />
              <span>DPDP DATA MASKING VERIFIED</span>
            </span>
            <span className="text-slate-300">|</span>
            <span>STATION: <strong className="text-slate-700 font-semibold">ICP-RXL-01</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Main Operational Surface */}
      <main className="flex-1 w-full mx-auto max-w-[1560px] p-4 sm:p-6 md:p-8">
        {children}
      </main>

      {/* 4. Professional Defense Console Footer */}
      <footer className="w-full bg-[#0B0F17] text-slate-400 text-xs border-t border-slate-800 mt-auto">
        <div className="mx-auto max-w-[1560px] px-4 py-6 flex flex-wrap items-center justify-between gap-4 text-[11px]">
          <div className="flex items-center gap-3">
            <ForgeProofLogo variant="compact" theme="dark" className="h-5 w-auto" />
            <div className="border-l border-slate-800 pl-3">
              <p className="font-semibold text-white">FORGEPROOF · AI IDENTIFICATION & DOCUMENT SCREENING</p>
              <p className="text-slate-500 text-[10px]">Ministry of Home Affairs (MHA) · Sashastra Seema Bal (SSB) · SIH26188</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono text-[10px]">
            <span>ICAO DOC 9303</span>
            <span>·</span>
            <span>ISO/IEC 30107-3 PAD</span>
            <span>·</span>
            <span>DPDP ACT 2023</span>
            <span>·</span>
            <span className="text-emerald-400 font-bold">V2.5 PRODUCTION</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
