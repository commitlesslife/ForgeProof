import { useState, useMemo } from 'react'
import { CheckCircle2, ChevronRight, Clock3, Filter, Search, ShieldAlert, AlertCircle } from 'lucide-react'
import { PageIntro } from '../components/PortalShell'
import { useLanguage } from '../utils/LanguageContext'

export default function OverviewPage({ cases, onViewCase, onNavigate }) {
  const { lang, t } = useLanguage()
  const [query, setQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState('ALL')

  const filtered = useMemo(() => {
    return cases.filter((item) => {
      const name = item.validation?.viz_fields?.full_name || item.holder_name || ''
      const riskLevel = (item.risk_assessment?.risk_level || item.risk_level || 'LOW').toUpperCase()
      const matchesQuery = `${item.case_id} ${name} ${item.doc_type || ''}`.toLowerCase().includes(query.toLowerCase())
      const matchesRisk = riskFilter === 'ALL' || riskLevel === riskFilter
      return matchesQuery && matchesRisk
    })
  }, [cases, query, riskFilter])

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

  const metrics = [
    {
      label: lang === 'hi' ? 'कुल मामले' : 'Total cases',
      value: String(stats.total).padStart(2, '0'),
      sub: lang === 'hi' ? 'आज दर्ज की गई जांच' : 'Screenings recorded today',
      icon: Filter,
      color: 'text-[#155985]'
    },
    {
      label: lang === 'hi' ? 'उच्च जोखिम अलर्ट' : 'High-risk flags',
      value: String(stats.high).padStart(2, '0'),
      sub: lang === 'hi' ? 'अधिकारी ध्यान आवश्यक' : 'Require officer attention',
      icon: ShieldAlert,
      color: 'text-[#b42318]'
    },
    {
      label: lang === 'hi' ? 'स्वीकृत' : 'Cleared',
      value: String(stats.cleared).padStart(2, '0'),
      sub: lang === 'hi' ? 'सत्यापन पूर्ण' : 'Passed verification',
      icon: CheckCircle2,
      color: 'text-[#087443]'
    },
    {
      label: lang === 'hi' ? 'औसत समीक्षा समय' : 'Average review time',
      value: '1.5s',
      sub: lang === 'hi' ? 'वास्तविक एआई विलंबता' : 'Current processing latency',
      icon: Clock3,
      color: 'text-[#155985]'
    }
  ]

  const todayStr = new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="animate-fade-in-up">
      {/* Page Intro Header */}
      <PageIntro
        eyebrow={lang === 'hi' ? 'आधिकारिक जांच कार्य केंद्र' : 'Official screening workstation'}
        title={lang === 'hi' ? 'केस निगरानी डैशबोर्ड' : 'Case oversight dashboard'}
        description={`Indira Gandhi International Airport · Terminal 3 ICP · ${todayStr}`}
      />

      {/* 4 Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="panel p-5">
            <div className="flex justify-between text-sm font-semibold text-slate-600">
              <span>{label}</span>
              <Icon size={19} className={color} />
            </div>
            <div className="mt-4 text-4xl font-bold tracking-tight text-[#123f68]">
              {value}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* Officer Action Callout Banner */}
      <section className="mt-6 flex flex-col justify-between gap-5 border border-[#a8bfd0] bg-[#e5eff5] p-6 md:flex-row md:items-center">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[.18em] text-[#155985]">
            {lang === 'hi' ? 'अधिकारी कार्रवाई' : 'Officer action'}
          </div>
          <h2 className="mt-1 text-xl font-bold text-[#123f68]">
            {lang === 'hi' ? 'नया दस्तावेज़ सत्यापन प्रारंभ करें' : 'Begin new document verification'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {lang === 'hi' ? 'स्क्रीनिंग शुरू करने के लिए यात्रा दस्तावेज़ का प्रकार चुनें।' : 'Select an identity document type to begin forensic & biometric screening.'}
          </p>
        </div>
        <button
          onClick={() => onNavigate('capture')}
          className="flex items-center justify-center gap-2 bg-[#c62828] hover:bg-[#a51f1f] px-5 py-3 text-sm font-bold text-white transition cursor-pointer shadow-xs shrink-0"
        >
          <span>{lang === 'hi' ? 'कैप्चर स्टेशन खोलें' : 'Open capture station'}</span>
          <ChevronRight size={17} />
        </button>
      </section>

      {/* Operational Queue Table */}
      <section className="panel mt-7">
        <div className="flex flex-col justify-between gap-4 border-b border-[#d3dce4] px-6 py-5 md:flex-row md:items-center">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[.18em] text-slate-500">
              {lang === 'hi' ? 'समीक्षा कतार' : 'Operational queue'}
            </div>
            <h2 className="mt-1 text-xl font-bold text-[#123f68]">
              {lang === 'hi' ? 'केस समीक्षा कतार' : 'Case review queue'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {lang === 'hi' ? 'अधिकारी के निर्णय की प्रतीक्षा कर रहे सभी जांचे गए दस्तावेज़।' : 'All screened documents awaiting officer disposition and verification.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={lang === 'hi' ? 'खोजें...' : 'Filter by case, name...'}
                className="h-9 w-48 sm:w-60 border border-[#d3dce4] bg-white pl-8 pr-3 text-xs text-slate-800 outline-none focus:border-[#155985]"
              />
            </div>
            <select
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value)}
              className="h-9 border border-[#d3dce4] bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-[#155985] cursor-pointer"
            >
              <option value="ALL">{lang === 'hi' ? 'सभी जोखिम स्तर' : 'All risk levels'}</option>
              <option value="LOW">{lang === 'hi' ? 'कम जोखिम' : 'Low risk'}</option>
              <option value="MEDIUM">{lang === 'hi' ? 'मध्यम जोखिम' : 'Medium risk'}</option>
              <option value="HIGH">{lang === 'hi' ? 'उच्च जोखिम' : 'High risk'}</option>
              <option value="CRITICAL">{lang === 'hi' ? 'गंभीर' : 'Critical'}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-[#f4f7f9] text-[11px] uppercase tracking-[.12em] text-slate-500">
              <tr>
                <th className="px-6 py-3.5 font-bold">{lang === 'hi' ? 'केस संदर्भ' : 'Case reference'}</th>
                <th className="px-6 py-3.5 font-bold">{lang === 'hi' ? 'दस्तावेज़ / यात्री' : 'Document / subject'}</th>
                <th className="px-6 py-3.5 font-bold">{lang === 'hi' ? 'जोखिम' : 'Risk'}</th>
                <th className="px-6 py-3.5 font-bold">{lang === 'hi' ? 'स्कोर' : 'Score'}</th>
                <th className="px-6 py-3.5 font-bold">{lang === 'hi' ? 'स्थिति' : 'Status'}</th>
                <th className="px-6 py-3.5 font-bold text-right">{lang === 'hi' ? 'कार्रवाई' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const name = item.validation?.viz_fields?.full_name || item.holder_name || 'Unknown Subject'
                const doc = item.doc_type || 'AADHAAR'
                const risk = (item.risk_assessment?.risk_level || item.risk_level || 'LOW').toUpperCase()
                const score = `${item.risk_assessment?.composite_score ?? item.composite_risk_score ?? 0}%`
                const status = item.officer_decision 
                  ? (lang === 'hi' ? '✓ मूल्यांकित' : '✓ Reviewed')
                  : (lang === 'hi' ? '⏳ समीक्षाधीन' : '⏳ Pending')

                const isHigh = risk === 'HIGH' || risk === 'CRITICAL'
                const isMedium = risk === 'MEDIUM'

                return (
                  <tr key={item.case_id} className="border-t border-[#e1e7ec] text-sm hover:bg-[#f8fafc] transition">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-[#155985]">
                      {item.case_id}
                    </td>
                    <td className="px-6 py-4">
                      <b className="block text-[#123f68] font-bold">{name}</b>
                      <span className="text-xs text-slate-500">{doc}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[11px] font-bold ${
                        isHigh 
                          ? 'bg-[#fff0d6] text-[#9b4c00]' 
                          : isMedium 
                            ? 'bg-amber-100 text-amber-900' 
                            : 'bg-[#d9f5e8] text-[#087443]'
                      }`}>
                        {risk}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#123f68]">
                      {score}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      {status}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onViewCase(item.case_id)}
                        className="border border-[#a8bfd0] px-4 py-1.5 text-xs font-bold text-[#155985] hover:bg-[#155985] hover:text-white transition cursor-pointer"
                      >
                        <span>{lang === 'hi' ? 'समीक्षा' : 'Review'}</span>
                        <ChevronRight className="ml-1 inline" size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <CheckCircle2 size={24} className="mx-auto text-emerald-600 mb-2" />
                    <p className="font-bold text-sm text-[#123f68]">
                      {lang === 'hi' ? 'कतार स्पष्ट है' : 'Operational Queue Clear'}
                    </p>
                    <p className="text-xs mt-0.5">
                      {lang === 'hi' ? 'कोई सक्रिय दस्तावेज़ समीक्षा के लिए लंबित नहीं है।' : 'No active screening instances pending officer review.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
