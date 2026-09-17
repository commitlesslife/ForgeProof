import { useState, useEffect } from 'react'
import { Bell, ClipboardList, FileSearch, LayoutDashboard, LogOut, ShieldCheck, ScanLine, UserCheck, MapPin, Moon, Sun, Volume2, VolumeX, Activity, Radio, Clock, Globe2, ChevronDown } from 'lucide-react'
import { isAudioMuted, setAudioMuted } from '../utils/audioAlerts'

const navLinks = [
  { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: LayoutDashboard },
  { id: 'capture', label: 'Capture station', shortLabel: 'Capture', icon: ScanLine },
  { id: 'audit', label: 'Audit history', shortLabel: 'Audit', icon: FileSearch },
  { id: 'readiness', label: 'System readiness', shortLabel: 'Readiness', icon: Activity },
  { id: 'advisories', label: 'Active advisories', shortLabel: 'Advisories', icon: Radio },
]

export default function PortalShell({ children, activePage, onNavigate, officer, onLogout }) {
  const [isDarkBooth, setIsDarkBooth] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('forgeproof_dark_booth') === 'true';
  })
  const [isMuted, setIsMutedState] = useState(() => isAudioMuted())
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isOfficerExpanded, setIsOfficerExpanded] = useState(false)
  const [isOfficerHovered, setIsOfficerHovered] = useState(false)

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
    if (next) {
      document.body.classList.add('dark-booth')
    } else {
      document.body.classList.remove('dark-booth')
    }
  }

  const toggleAudio = () => {
    const next = !isMuted
    setIsMutedState(next)
    setAudioMuted(next)
  }

  const officerName = officer?.full_name || officer?.officer_id || 'Screening Officer'
  const dutyStation = officer?.duty_station || 'Border Inspection Post'
  const badgeNo = officer?.badge_number || officer?.officer_id || 'SEC-001'
  const rank = officer?.rank || 'Immigration Inspector'
  const clearanceLevel = officer?.clearance_level || 'LEVEL_3_SUPERVISOR'

  // Time formatters
  const localTimeStr = currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const utcHours = String(currentTime.getUTCHours()).padStart(2, '0')
  const utcMins = String(currentTime.getUTCMinutes()).padStart(2, '0')
  const utcSecs = String(currentTime.getUTCSeconds()).padStart(2, '0')
  const utcTimeStr = `${utcHours}:${utcMins}:${utcSecs} Z`

  // Initials for avatar
  const initials = officerName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'SO'

  return (
    <div className="min-h-screen text-[#615D73]">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1480px] gap-5 p-4 md:p-6">
        {/* Sticky & Viewport-Locked Sidebar */}
        <aside className="glass-effect hidden w-64 shrink-0 flex-col rounded-[28px] p-4.5 md:flex border border-white/80 shadow-xs sticky top-4 md:top-6 h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] self-start overflow-y-auto no-scrollbar">
          <button onClick={() => onNavigate('overview')} className="flex items-center gap-3 px-2 py-2 text-left group cursor-pointer">
            <span className="flex size-10 items-center justify-center rounded-2xl glass-navy text-white shadow-xs group-hover:scale-[1.02] transition-transform">
              <ShieldCheck size={22} />
            </span>
            <span>
              <span className="block text-base font-black tracking-tight text-[#0B477A]">ForgeProof</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#615D73]/80">Border AI Security</span>
            </span>
          </button>

          {/* Operational Dual Clocks (Station Local + ICAO UTC / Zulu) */}
          <div className="mt-3.5 rounded-xl glass-card px-3 py-2 border border-white/80 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#615D73]">
              <span className="flex items-center gap-1.5"><Clock size={11} className="text-[#0B477A]" /> Station</span>
              <span className="font-mono text-[#0B477A] font-extrabold">{localTimeStr}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#615D73]/80 pt-0.5 border-t border-slate-200/50">
              <span className="flex items-center gap-1.5"><Globe2 size={11} className="text-[#0B477A]" /> ICAO UTC</span>
              <span className="font-mono text-[#0B477A] font-extrabold">{utcTimeStr}</span>
            </div>
          </div>

          <div className="mt-5 space-y-1">
            {navLinks.map(({ id, label, icon: Icon }) => {
              const active = activePage === id
              return (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-xs transition-all duration-200 cursor-pointer ${
                    active
                      ? 'glass-navy text-white font-bold shadow-xs'
                      : 'text-[#615D73] hover:bg-[#0B477A]/10 hover:text-[#0B477A] font-medium'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-white' : 'text-[#615D73]'} />
                  {label}
                </button>
              )
            })}
          </div>

          {/* Officer Identity Pill (Compact by default, expands on hover or click) */}
          <div className="mt-auto space-y-2">
            <div 
              onMouseEnter={() => setIsOfficerHovered(true)}
              onMouseLeave={() => setIsOfficerHovered(false)}
              className="rounded-2xl glass-card p-2.5 transition-all duration-300 border border-white/80 shadow-xs hover:border-[#0B477A]/30 group"
            >
              {/* Compact Header (Always Visible & Clickable) */}
              <button
                type="button"
                onClick={() => setIsOfficerExpanded(prev => !prev)}
                className="w-full flex items-center gap-2.5 text-left cursor-pointer focus:outline-none"
                title={isOfficerExpanded || isOfficerHovered ? "Click to collapse" : "Click or hover to expand officer credentials"}
              >
                <div className="size-8 rounded-xl glass-navy text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                    <p className="text-xs font-bold text-[#0B477A] truncate leading-tight">{officerName}</p>
                  </div>
                  <p className="text-[10px] text-[#615D73] font-medium truncate">{rank}</p>
                </div>
                <span className={`text-[#615D73] transition-transform duration-200 p-0.5 ${isOfficerExpanded || isOfficerHovered ? 'rotate-180 text-[#0B477A]' : ''}`}>
                  <ChevronDown size={14} />
                </span>
              </button>

              {/* Smoothly Expandable Body on Hover or Click */}
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isOfficerExpanded || isOfficerHovered 
                    ? 'max-h-48 opacity-100 pt-2' 
                    : 'max-h-0 opacity-0 pt-0 pointer-events-none'
                }`}
              >
                <div className="space-y-1.5 pt-1.5 border-t border-slate-200/60 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#615D73] font-semibold">Badge No:</span>
                    <span className="font-mono text-[#0B477A] font-bold glass-navy-subtle px-1.5 py-0.5 rounded">{badgeNo}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#615D73] font-semibold">Clearance:</span>
                    <span className="font-bold text-[#0B477A] truncate max-w-[125px]">
                      {clearanceLevel.replace('LEVEL_', 'LVL ').replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#615D73] font-semibold">Duty Post:</span>
                    <span className="text-[#615D73] truncate max-w-[125px]" title={dutyStation}>
                      {dutyStation.includes('(') ? dutyStation.split('(')[0].trim() : dutyStation}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <div className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                      <span className="text-[10px] font-bold text-emerald-800">Active Duty</span>
                    </div>
                    <span className="text-[9px] font-mono text-[#615D73] font-semibold">Shift A</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-1.5 text-xs font-semibold text-[#615D73] hover:bg-rose-50/80 hover:text-[#D30B0D] transition cursor-pointer"
            >
              <LogOut size={14} />
              Sign out session
            </button>
          </div>
        </aside>

        {/* Mobile Bottom Navigation */}
        <nav className="glass-effect fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-white/60 px-1 py-1.5 pb-safe md:hidden shadow-[0_-8px_30px_rgba(11,71,122,0.12)]">
          {navLinks.map(({ id, label, shortLabel, icon: Icon }) => {
            const active = activePage === id
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-2xl transition-all active:scale-95 cursor-pointer ${
                  active 
                    ? 'glass-navy text-white font-bold' 
                    : 'text-[#615D73] hover:text-[#0B477A]'
                }`}
              >
                <Icon size={17} className={active ? 'text-white' : ''} />
                <span className="text-[10px] font-semibold tracking-tight">{shortLabel || label}</span>
              </button>
            )
          })}
        </nav>

        {/* Main Content */}
        <div className="min-w-0 flex-1">
          <header className="glass-effect mb-4 md:mb-5 flex items-center justify-between rounded-[22px] md:rounded-[24px] px-4 py-3.5 md:px-7 md:py-4 border border-white/60">
            <div className="min-w-0 pr-2">
              <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.18em] text-[#0B477A] flex items-center gap-1.5 truncate">
                <MapPin size={12} className="text-[#0B477A] shrink-0" /> {dutyStation}
              </p>
              <h1 className="mt-0.5 text-lg md:text-2xl font-bold tracking-tight text-[#0B477A] truncate">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {officerName.split(' ')[0]}
              </h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex items-center gap-2 rounded-full glass-navy-subtle px-3 py-1.5 text-xs font-semibold text-[#0B477A]">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[11px] font-bold text-[#0B477A]">{badgeNo}</span>
              </div>
              {/* Tactical Audio Alert Toggle */}
              <button 
                onClick={toggleAudio}
                className={`rounded-full border p-2 transition active:scale-95 cursor-pointer shadow-xs ${
                  isMuted 
                    ? 'border-rose-300 bg-rose-50 text-rose-600' 
                    : 'border-white/60 bg-white/70 text-[#0B477A] hover:bg-white'
                }`}
                title={isMuted ? "Unmute Audio Alerts" : "Mute Tactical Audio Alerts"}
                aria-label="Toggle Audio Alerts"
              >
                {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </button>

              {/* Optional Tactical Dark Booth Mode Toggle */}
              <button 
                onClick={toggleDarkBooth}
                className={`rounded-full border p-2 transition active:scale-95 cursor-pointer shadow-xs ${
                  isDarkBooth 
                    ? 'border-amber-400/80 bg-amber-400/20 text-amber-300 hover:bg-amber-400/30' 
                    : 'border-white/60 bg-white/70 text-[#615D73] hover:bg-white hover:text-[#0B477A]'
                }`}
                title={isDarkBooth ? "Switch to Default Light Mode" : "Switch to Tactical Dark Booth Mode"}
                aria-label="Toggle Dark Booth Mode"
              >
                {isDarkBooth ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              <button 
                onClick={() => alert(`Officer: ${officerName}\nStation: ${dutyStation}\nBadge: ${badgeNo}\nAll systems operational.`)}
                className="rounded-full border border-white/60 bg-white/70 p-2 text-[#615D73] transition hover:bg-white hover:text-[#0B477A] active:scale-95 cursor-pointer shadow-xs" 
                aria-label="Notifications"
              >
                <Bell size={17} />
              </button>
              {/* Mobile Sign Out Button */}
              <button
                onClick={onLogout}
                className="flex md:hidden items-center gap-1 rounded-full border border-[#615D73]/25 bg-white/70 px-2.5 py-1.5 text-xs font-semibold text-[#615D73] hover:bg-rose-50 hover:text-[#D30B0D] transition active:scale-95 cursor-pointer"
                title="Sign out"
              >
                <LogOut size={15} />
                <span className="text-[11px]">Exit</span>
              </button>
            </div>
          </header>
          <main className="pb-28 md:pb-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
