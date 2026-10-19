import { useState, useMemo } from 'react'
import { ArrowRight, CheckCircle2, Clock3, Filter, Search, ShieldAlert, RefreshCw } from 'lucide-react'
import { useLanguage } from '../utils/LanguageContext'
import { API_BASE } from '../config'

const riskStyles = {
  LOW: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  MEDIUM: 'bg-amber-100 text-amber-800 border-amber-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  CRITICAL: 'bg-[#D30B0D]/10 text-[#D30B0D] border border-[#D30B0D]/30 font-black',
  Low: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Medium: 'bg-amber-100 text-amber-800 border-amber-300',
  High: 'bg-orange-100 text-orange-800 border-orange-300',
  Critical: 'bg-[#D30B0D]/10 text-[#D30B0D] border border-[#D30B0D]/30 font-black',
}

export default function OverviewPage({ cases, onViewCase, onNavigate, onRefreshQueue }) {
  const { lang, t } = useLanguage()
  const [query, setQuery] = useState('')
  const [risk, setRisk] = useState('ALL')
  const [isResetting, setIsResetting] = useState(false)
  const [resetNotice, setResetNotice] = useState(null)

  const handleResetSandbox = async () => {
    setIsResetting(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/system/reset-demo`, {
        method: 'POST'
      })
      const data = await res.json()
      if (data.success) {
        setResetNotice('Demo sandbox restored to 7 pristine benchmark scenarios.')
        setTimeout(() => setResetNotice(null), 5000)
        if (onRefreshQueue) onRefreshQueue()
      }
    } catch (err) {
      console.error('Failed to reset sandbox:', err)
    } finally {
      setIsResetting(false)
    }
  }

  const filtered = useMemo(
    () =>
      cases.filter((item) => {
        const name = item.validation?.viz_fields?.full_name || item.holder_name || ''
        const riskLevel = (item.risk_assessment?.risk_level || item.risk_level || 'LOW').toUpperCase()
        const matchesQuery = `${item.case_id} ${name} ${item.doc_type || ''}`.toLowerCase().includes(query.toLowerCase())
        const matchesRisk = risk === 'ALL' || riskLevel === risk
        return matchesQuery && matchesRisk
      }),
    [cases, query, risk]
  )

  const stats = useMemo(() => {
    const total = cases.length
    const high = cases.filter(c => {
      const rl = (c.risk_assessment?.risk_level || c.risk_level || '').toUpperCase()
      return rl === 'HIGH' || rl === 'CRITICAL'
    }).length
    const cleared = cases.filter(c => {
      const rl = (c.risk_assessment?.risk_level || c.risk_level || '').toUpperCase()
      return rl === 'LOW'
    }).length
    return { total, high, cleared }
  }, [cases])

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in-up pb-8">
      {/* Official Section Header */}
      <div className="flex items-center justify-between border-b border-[#0B477A]/15 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B477A] tracking-tight flex items-center gap-2">
            <span>{t('dashboard_title')}</span>
          </h1>
          <p className="text-xs text-[#615D73] mt-0.5 font-medium">
            {t('dashboard_sub')}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 font-mono text-[11px] bg-white/80 px-3 py-1.5 rounded-xl border border-[#0B477A]/15 shadow-xs">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[#0B477A] font-bold">{t('system_status')}</span>
        </div>
      </div>

      {/* Stats Cards: 2x2 on mobile, 4 columns on desktop */}
      <section className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { 
            label: t('total_screened'), 
            sub: t('total_screened_sub'), 
            value: String(stats.total).padStart(2, '0'), 
            icon: Filter, 
            tone: 'text-[#0B477A]', 
            borderTone: 'border-[#0B477A]/25' 
          },
          { 
            label: t('critical_referrals'), 
            sub: t('critical_referrals_sub'), 
            value: String(stats.high).padStart(2, '0'), 
            icon: ShieldAlert, 
            tone: 'text-[#D30B0D]', 
            borderTone: 'border-[#D30B0D]/30' 
          },
          { 
            label: t('admissible_travelers'), 
            sub: t('admissible_travelers_sub'), 
            value: String(stats.cleared).padStart(2, '0'), 
            icon: CheckCircle2, 
            tone: 'text-emerald-700', 
            borderTone: 'border-emerald-500/30' 
          },
          { 
            label: t('mean_latency'), 
            sub: t('mean_latency_sub'), 
            value: '1.52s', 
            icon: Clock3, 
            tone: 'text-[#0B477A]', 
            borderTone: 'border-amber-500/30' 
          },
        ].map(({ label, sub, value, icon: Icon, tone, borderTone }) => (
          <div key={label} className={`glass-card rounded-2xl p-4 cursor-default border transition hover:bg-white/80 shadow-xs ${borderTone}`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">{label}</span>
                <span className="text-[10px] font-mono text-[#615D73]">{sub}</span>
              </div>
              <div className="size-8 rounded-xl bg-white/70 border border-slate-200/80 flex items-center justify-center shadow-2xs">
                <Icon className={`${tone} shrink-0`} size={17} />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-mono font-extrabold tracking-tight text-[#0B477A]">{value}</p>
          </div>
        ))}
      </section>

      {/* Primary Inspection Quick Action CTA */}
      <button
        onClick={() => onNavigate('capture')}
        className="w-full glass-card hover:bg-white/95 rounded-2xl sm:rounded-[24px] p-4 sm:p-5 flex items-center justify-between group cursor-pointer border border-[#0B477A]/30 transition-all shadow-xs active:scale-[0.99]"
      >
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#0B477A] bg-[#0B477A]/10 border border-[#0B477A]/25 px-2 py-0.5 rounded-md">
              {t('statutory_action')}
            </span>
            <span className="text-[10px] font-mono text-emerald-800 font-bold hidden sm:inline">
              ● {t('scanner_ready')}
            </span>
          </div>
          <h2 className="mt-1 text-base sm:text-lg font-extrabold tracking-tight text-[#0B477A]">
            {t('new_screening_title')}
          </h2>
          <p className="mt-0.5 text-xs text-[#615D73] font-medium">
            {t('new_screening_sub')}
          </p>
        </div>
        <div className="size-10 sm:size-11 rounded-2xl bg-[#0B477A] text-white flex items-center justify-center shrink-0 ml-3 group-hover:bg-[#08345a] transition-all shadow-sm">
          <ArrowRight className="text-white group-hover:translate-x-0.5 transition-transform" size={19} />
        </div>
      </button>

      {/* Case Queue */}
      <section className="glass-effect rounded-[22px] sm:rounded-[28px] p-4 sm:p-6 border border-white/70 shadow-xs">
        <div className="flex flex-col justify-between gap-3 sm:gap-4 md:flex-row md:items-end border-b border-[#0B477A]/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#615D73] bg-white/80 border border-slate-200 px-2 py-0.5 rounded-md">
                {t('restricted_record')}
              </span>
            </div>
            <h2 className="mt-1 text-lg sm:text-xl font-extrabold tracking-tight text-[#0B477A]">
              {t('queue_title')}
            </h2>
            <p className="mt-0.5 text-xs text-[#615D73]">
              {t('queue_sub')}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row w-full md:w-auto">
            <label className="relative flex-1 sm:flex-initial">
              <Search size={15} className="absolute left-3.5 top-2.5 text-slate-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="h-9 w-full sm:w-64 rounded-xl border border-slate-200 bg-white/80 pl-9 pr-3 text-xs text-slate-800 outline-none placeholder-slate-400 focus:ring-2 focus:ring-[#0B477A]/20 focus:border-[#0B477A] transition font-medium"
              />
            </label>
            <select
              value={risk}
              onChange={e => setRisk(e.target.value)}
              aria-label="Filter queue by risk level"
              className="h-9 rounded-xl border border-slate-200 bg-white/80 px-2.5 text-xs text-slate-700 font-bold outline-none focus:ring-2 focus:ring-[#0B477A]/20 cursor-pointer"
            >
              <option value="ALL">{t('all_risk')}</option>
              <option value="LOW">{t('low_risk')}</option>
              <option value="MEDIUM">{t('med_risk')}</option>
              <option value="HIGH">{t('high_risk')}</option>
              <option value="CRITICAL">{t('crit_risk')}</option>
            </select>
            <button
              onClick={handleResetSandbox}
              disabled={isResetting}
              title="Purge dirty test records and restore 7 pristine benchmark evaluation cases"
              className="h-9 px-3 rounded-xl border border-[#0B477A]/20 bg-white/80 hover:bg-white text-[#615D73] hover:text-[#0B477A] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition hover:border-[#0B477A] disabled:opacity-50 shrink-0"
            >
              <RefreshCw size={13} className={isResetting ? "animate-spin text-[#0B477A]" : "text-[#615D73]"} />
              <span>{isResetting ? "Restoring..." : "Reset Demo Sandbox"}</span>
            </button>
          </div>
        </div>

        {/* Sandbox Reset Confirmation Banner */}
        {resetNotice && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-medium flex items-center justify-between animate-fade-in-up">
            <span className="flex items-center gap-1.5 font-sans">
              <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
              {resetNotice}
            </span>
            <button 
              onClick={() => setResetNotice(null)}
              className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Mobile View: High Density Cards (< md) */}
        <div className="mt-4 space-y-3 md:hidden">
          {filtered.map((item) => {
            const riskLvl = (item.risk_assessment?.risk_level || item.risk_level || 'LOW').toUpperCase()
            const score = item.risk_assessment?.composite_score ?? item.composite_risk_score ?? 0
            return (
              <div key={item.case_id} className="rounded-2xl border border-white/80 glass-card p-4 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#0B477A] bg-white/80 border border-[#0B477A]/20 px-2 py-0.5 rounded-lg">
                      {item.case_id}
                    </span>
                    <span className="text-[11px] text-[#615D73] font-medium">
                      {item.officer_decision ? t('adjudicated') : t('pending_review')}
                    </span>
                  </div>
                  <span className={`rounded-lg px-2.5 py-0.5 text-xs font-black uppercase border ${riskStyles[riskLvl] || riskStyles.LOW}`}>
                    {riskLvl}
                  </span>
                </div>

                <div>
                  <p className="font-extrabold text-sm text-[#0B477A]">
                    {item.validation?.viz_fields?.full_name || item.holder_name || 'Unknown Subject'}
                  </p>
                  <p className="text-xs text-[#615D73] font-medium">{item.doc_type || 'Identity Document'}</p>
                </div>

                {/* Score bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-[#615D73]">
                    <span>{t('risk_score')}</span>
                    <span className="font-mono font-bold text-[#0B477A]">{score}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200/80 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${score > 60 ? 'bg-[#D30B0D]' : score > 30 ? 'bg-amber-500' : 'bg-emerald-600'}`} 
                      style={{ width: `${Math.min(100, score)}%` }} 
                    />
                  </div>
                </div>

                <button
                  onClick={() => onViewCase(item.case_id)}
                  className="w-full py-2 rounded-xl bg-[#0B477A] hover:bg-[#08345a] active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  {t('review_case_dossier')} <ArrowRight size={14} className="text-white" />
                </button>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="py-10 text-center space-y-2.5">
              <div className="size-10 rounded-2xl bg-white/80 text-[#0B477A] mx-auto flex items-center justify-center border border-slate-200 shadow-xs">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-xs font-bold text-[#0B477A]">{t('queue_clear_title')}</p>
              <p className="text-[11px] text-[#615D73]">{t('queue_clear_desc')}</p>
            </div>
          )}
        </div>

        {/* Desktop View: Full Data Table (>= md) */}
        <div className="mt-6 hidden md:block overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs rounded-2xl overflow-hidden border border-slate-200/80">
            <thead className="bg-[#0B477A] text-white text-[11px] uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-3.5">{t('col_dossier')}</th>
                <th className="py-3 px-3.5">{t('col_subject')}</th>
                <th className="py-3 px-3.5">{t('col_classification')}</th>
                <th className="py-3 px-3.5">{t('col_risk')}</th>
                <th className="py-3 px-3.5">{t('col_status')}</th>
                <th className="py-3 px-3.5 text-right">{t('col_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/70">
              {filtered.map((item) => {
                const riskLvl = (item.risk_assessment?.risk_level || item.risk_level || 'LOW').toUpperCase()
                return (
                  <tr key={item.case_id} className="group hover:bg-white transition">
                    <td className="py-3 px-3.5 font-mono text-xs font-bold text-[#0B477A]">
                      <span className="bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-lg">
                        {item.case_id}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <p className="font-extrabold text-xs text-[#0B477A]">{item.validation?.viz_fields?.full_name || item.holder_name || 'Unknown Subject'}</p>
                      <p className="text-[10px] font-mono text-[#615D73] uppercase">{item.doc_type || 'Document'}</p>
                    </td>
                    <td className="py-3 px-3.5">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${riskStyles[riskLvl] || riskStyles.LOW}`}>
                        {riskLvl}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-xs font-bold text-[#0B477A]">
                      {item.risk_assessment?.composite_score ?? item.composite_risk_score ?? '—'}%
                    </td>
                    <td className="py-3 px-3.5">
                      <span className={`text-[11px] font-bold ${item.officer_decision ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {item.officer_decision ? t('adjudicated') : t('pending_review')}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right">
                      <button
                        onClick={() => onViewCase(item.case_id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B477A] hover:bg-[#08345a] text-white px-3 py-1.5 text-xs font-bold transition cursor-pointer active:scale-95 shadow-xs"
                      >
                        <span>{t('btn_examine')}</span>
                        <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-14 text-center space-y-3">
              <div className="size-12 rounded-2xl bg-white/80 text-[#0B477A] mx-auto flex items-center justify-center border border-slate-200 shadow-xs">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[#0B477A] text-sm sm:text-base">{t('queue_clear_title')}</h3>
                <p className="text-xs text-[#615D73] mt-0.5 max-w-sm mx-auto">
                  {t('queue_clear_desc')}
                </p>
              </div>
              <button
                onClick={() => onNavigate('capture')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B477A] text-white text-xs font-bold hover:bg-[#08345a] transition cursor-pointer active:scale-95 shadow-xs"
              >
                <span>{t('open_capture_btn')}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
