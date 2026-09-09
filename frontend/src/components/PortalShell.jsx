import { Bell, ClipboardList, FileSearch, LayoutDashboard, LogOut, ShieldCheck, ScanLine, UserCheck, MapPin } from 'lucide-react'

const navLinks = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'capture', label: 'Capture station', icon: ScanLine },
  { id: 'audit', label: 'Audit history', icon: FileSearch },
]

export default function PortalShell({ children, activePage, onNavigate, officer, onLogout }) {
  const officerName = officer?.full_name || officer?.officer_id || 'Screening Officer'
  const dutyStation = officer?.duty_station || 'Border Inspection Post'
  const badgeNo = officer?.badge_number || officer?.officer_id || 'SEC-001'
  const rank = officer?.rank || 'Immigration Inspector'

  return (
    <div className="min-h-screen text-[#615D73]">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1480px] gap-5 p-4 md:p-6">
        {/* Sidebar */}
        <aside className="glass-effect hidden w-64 shrink-0 flex-col rounded-[28px] p-5 md:flex border border-white/60">
          <button onClick={() => onNavigate('overview')} className="flex items-center gap-3 px-2 py-3 text-left">
            <span className="flex size-11 items-center justify-center rounded-2xl glass-navy text-white">
              <ShieldCheck size={23} />
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight text-[#0B477A]">ForgeProof</span>
              <span className="text-[11px] text-[#615D73] font-medium">Border AI Verification</span>
            </span>
          </button>

          <div className="mt-8 space-y-1.5">
            {navLinks.map(({ id, label, icon: Icon }) => {
              const active = activePage === id
              return (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm transition-all hover:-translate-y-0.5 cursor-pointer ${
                    active
                      ? 'glass-navy text-white font-bold'
                      : 'text-[#615D73] hover:bg-[#0B477A]/10 hover:text-[#0B477A] font-medium'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-white' : 'text-[#615D73]'} />
                  {label}
                </button>
              )
            })}
          </div>

          {/* Active Officer Identity Card in Sidebar */}
          <div className="mt-auto space-y-3">
            <div className="rounded-2xl glass-card p-3.5 space-y-1 text-left">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <p className="text-xs font-bold text-[#0B477A] truncate">{officerName}</p>
              </div>
              <p className="text-[11px] text-[#615D73] font-medium">{rank}</p>
              <p className="text-[10px] font-mono text-[#0B477A] font-bold glass-navy-subtle px-2 py-0.5 rounded-md inline-block">{badgeNo}</p>
            </div>

            <button
              onClick={onLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-[#615D73] hover:bg-rose-50/80 hover:text-[#D30B0D] transition cursor-pointer"
            >
              <LogOut size={17} />
              Sign out
            </button>
          </div>
        </aside>

        {/* Mobile Bottom Navigation */}
        <nav className="glass-effect fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-white/60 px-2 py-2 pb-safe md:hidden shadow-[0_-8px_30px_rgba(11,71,122,0.12)]">
          {navLinks.map(({ id, label, icon: Icon }) => {
            const active = activePage === id
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className={`flex flex-1 flex-col items-center justify-center gap-1 py-1.5 px-2 rounded-2xl transition-all active:scale-95 cursor-pointer ${
                  active 
                    ? 'glass-navy text-white font-bold' 
                    : 'text-[#615D73] hover:text-[#0B477A]'
                }`}
              >
                <Icon size={19} className={active ? 'text-white' : ''} />
                <span className="text-[11px] font-semibold tracking-tight">{label}</span>
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
