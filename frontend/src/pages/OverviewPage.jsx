import { useState, useMemo } from 'react'
import { ArrowRight, CheckCircle2, Clock3, Filter, Search, ShieldAlert } from 'lucide-react'

const riskStyles = {
  LOW: 'bg-emerald-100 text-emerald-800',
  MEDIUM: 'bg-amber-100 text-amber-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-[#D30B0D]/10 text-[#D30B0D] border border-[#D30B0D]/30 font-black',
  Low: 'bg-emerald-100 text-emerald-800',
  Medium: 'bg-amber-100 text-amber-800',
  High: 'bg-orange-100 text-orange-800',
  Critical: 'bg-[#D30B0D]/10 text-[#D30B0D] border border-[#D30B0D]/30 font-black',
}

export default function OverviewPage({ cases, onViewCase, onNavigate }) {
  const [query, setQuery] = useState('')
  const [risk, setRisk] = useState('All risk')

  const filtered = useMemo(
    () =>
      cases.filter(
        (item) => {
          const name = item.validation?.viz_fields?.full_name || item.holder_name || ''
          const riskLevel = (item.risk_assessment?.risk_level || item.risk_level || 'LOW').toUpperCase()
          const matchesQuery = `${item.case_id} ${name} ${item.doc_type || ''}`.toLowerCase().includes(query.toLowerCase())
          const matchesRisk = risk === 'All risk' || riskLevel === risk.toUpperCase()
          return matchesQuery && matchesRisk
        }
      ),
    [cases, query, risk]
  )

  const stats = useMemo(() => {
    const total = cases.length
    const high = cases.filter(c => {
      const rl = c.risk_assessment?.risk_level || c.risk_level
      return rl === 'HIGH' || rl === 'CRITICAL'
    }).length
    const cleared = cases.filter(c => {
      const rl = c.risk_assessment?.risk_level || c.risk_level
      return rl === 'LOW' || rl === 'Low'
    }).length
    return { total, high, cleared }
  }, [cases])

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Stats Cards: 2x2 on mobile, 4 columns on desktop */}
      <section className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total cases', value: String(stats.total).padStart(2, '0'), detail: 'Screenings', icon: Filter, tone: 'text-[#0B477A]' },
          { label: 'High-risk flags', value: String(stats.high).padStart(2, '0'), detail: 'Attention needed', icon: ShieldAlert, tone: 'text-[#D30B0D]' },
          { label: 'Cleared', value: String(stats.cleared).padStart(2, '0'), detail: 'Passed genuine', icon: CheckCircle2, tone: 'text-emerald-600' },
          { label: 'Avg. review time', value: '6s', detail: 'Processing time', icon: Clock3, tone: 'text-[#0B477A]' },
        ].map(({ label, value, detail, icon: Icon, tone }) => (
          <div key={label} className="glass-effect hover-lift rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 cursor-default border border-white/70">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-[#615D73] truncate">{label}</span>
              <Icon className={`${tone} shrink-0`} size={18} />
            </div>
            <p className="mt-2 sm:mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B477A]">{value}</p>
            <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-[#615D73] truncate">{detail}</p>
          </div>
        ))}
      </section>

      {/* New Verification CTA */}
      <button
        onClick={() => onNavigate('capture')}
        className="w-full glass-effect hover-lift rounded-[22px] sm:rounded-[24px] p-4 sm:p-5 flex items-center justify-between group cursor-pointer border border-white/70 hover:border-[#0B477A]/40 transition-all active:scale-[0.99]"
      >
        <div className="text-left">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[#0B477A]">Quick action</p>
          <h2 className="mt-0.5 sm:mt-1 text-lg sm:text-xl font-bold tracking-tight text-[#0B477A]">Start new verification</h2>
          <p className="mt-0.5 text-xs sm:text-sm text-[#615D73]">Upload or scan a document to begin AI screening.</p>
        </div>
        <div className="size-10 sm:size-11 rounded-2xl glass-navy-subtle flex items-center justify-center shrink-0 ml-3 group-hover:glass-navy group-hover:text-white transition-all">
          <ArrowRight className="text-[#0B477A] group-hover:text-white transition-transform duration-200 group-hover:translate-x-1" size={20} />
        </div>
      </button>

      {/* Case Queue */}
      <section className="glass-effect rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 md:p-7 border border-white/70">
        <div className="flex flex-col justify-between gap-3 sm:gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-[#615D73]">History</p>
            <h2 className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold tracking-tight text-[#0B477A]">Case review queue</h2>
            <p className="mt-0.5 text-xs sm:text-sm text-[#615D73]">All screened documents and their verdicts.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row w-full md:w-auto">
            <label className="relative flex-1 sm:flex-initial">
              <Search size={16} className="absolute left-3.5 top-3.5 text-[#615D73]/60" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search cases"
                className="h-11 sm:h-10 w-full sm:w-60 rounded-xl border border-white/80 bg-white/80 pl-10 pr-3 text-sm text-[#0B477A] outline-none placeholder-[#615D73]/50 focus:ring-2 focus:ring-[#0B477A]/20 focus:border-[#0B477A] transition"
              />
            </label>
            <select
              value={risk}
              onChange={e => setRisk(e.target.value)}
              className="h-11 sm:h-10 rounded-xl border border-white/80 bg-white/80 px-3 text-sm text-[#615D73] outline-none focus:ring-2 focus:ring-[#0B477A]/20"
            >
              <option>All risk</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>
        </div>

        {/* Mobile View: High Density Cards (< md) */}
        <div className="mt-4 space-y-3 md:hidden">
          {filtered.map((item) => {
            const riskLvl = item.risk_assessment?.risk_level || item.risk_level || 'LOW'
            const score = item.risk_assessment?.composite_score ?? item.composite_risk_score ?? 0
            return (
              <div key={item.case_id} className="rounded-2xl border border-white/80 glass-card p-4 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#0B477A] glass-navy-subtle px-2 py-0.5 rounded-md">
                      {item.case_id}
                    </span>
                    <span className="text-[11px] text-[#615D73]">
                      {item.officer_decision ? 'Reviewed' : 'Pending'}
                    </span>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-black uppercase ${riskStyles[riskLvl] || riskStyles.Low}`}>
                    {riskLvl}
                  </span>
                </div>

                <div>
                  <p className="font-bold text-sm text-[#0B477A]">
                    {item.validation?.viz_fields?.full_name || item.holder_name || 'Unknown Subject'}
                  </p>
                  <p className="text-xs text-[#615D73]">{item.doc_type || 'Identity Document'}</p>
                </div>

                {/* Score bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-[#615D73]">
                    <span>Risk Score</span>
                    <span className="font-mono font-bold text-[#0B477A]">{score}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#615D73]/15 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${score > 60 ? 'bg-[#D30B0D]' : score > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                      style={{ width: `${Math.min(100, score)}%` }} 
                    />
                  </div>
                </div>

                <button
                  onClick={() => onViewCase(item.case_id)}
                  className="w-full py-2.5 rounded-xl glass-navy active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  Review Case Dossier <ArrowRight size={14} className="text-white" />
                </button>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs text-[#615D73]">No cases match your filters.</div>
          )}
        </div>

        {/* Desktop View: Full Data Table (>= md) */}
        <div className="mt-6 hidden md:block overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-[#615D73]/20 text-xs uppercase tracking-wider text-[#615D73]">
              <tr>
                <th className="pb-3 font-semibold">Case</th>
                <th className="pb-3 font-semibold">Document</th>
                <th className="pb-3 font-semibold">Risk</th>
                <th className="pb-3 font-semibold">Score</th>
                <th className="pb-3 font-semibold">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.case_id} className="group border-b border-[#615D73]/15 last:border-0 hover:bg-white/40 transition">
                  <td className="py-4 font-mono text-xs font-bold text-[#0B477A]">{item.case_id}</td>
                  <td className="py-4">
                    <p className="font-semibold text-[#0B477A]">{item.validation?.viz_fields?.full_name || item.holder_name || 'Unknown'}</p>
                    <p className="text-xs text-[#615D73]">{item.doc_type || 'Document'}</p>
                  </td>
                  <td className="py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${riskStyles[item.risk_assessment?.risk_level || item.risk_level] || riskStyles.Low}`}>
                      {item.risk_assessment?.risk_level || item.risk_level || 'LOW'}
                    </span>
                  </td>
                  <td className="py-4 font-semibold text-[#615D73]">
                    {item.risk_assessment?.composite_score ?? item.composite_risk_score ?? '—'}%
                  </td>
                  <td className="py-4 text-[#615D73]">{item.officer_decision ? 'Reviewed' : 'Pending'}</td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => onViewCase(item.case_id)}
                      className="inline-flex items-center gap-1.5 rounded-xl glass-navy-subtle hover:glass-navy hover:text-white px-3.5 py-1.5 text-xs font-bold text-[#0B477A] transition cursor-pointer active:scale-95"
                    >
                      Review <ArrowRight size={14} className="" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-[#615D73]">No cases match your filters.</div>
          )}
        </div>
      </section>
    </div>
  )
}
