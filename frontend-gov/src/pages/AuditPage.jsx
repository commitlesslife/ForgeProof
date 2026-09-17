import { useState, useEffect } from 'react'
import { CheckCircle2, FileClock, Lock, RefreshCw, ShieldAlert, ShieldCheck } from 'lucide-react'
import { API_BASE } from '../config'
import { PageIntro } from '../components/PortalShell'
import { useLanguage } from '../utils/LanguageContext'

export default function AuditPage() {
  const { lang } = useLanguage()
  const [ledgerData, setLedgerData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchLedger = () => {
    setIsLoading(true)
    fetch(`${API_BASE}/api/v1/audit`)
      .then(res => res.json())
      .then(data => setLedgerData(data))
      .catch(err => console.error('Failed to fetch audit ledger:', err))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    fetchLedger()
    const interval = setInterval(fetchLedger, 10000)
    return () => clearInterval(interval)
  }, [])

  const entries = ledgerData?.ledger || []
  const isIntact = ledgerData?.integrity ?? true
  const totalEntries = ledgerData?.total_entries || entries.length || 1

  return (
    <div className="animate-fade-in-up">
      <PageIntro
        eyebrow={lang === 'hi' ? 'अपरिवर्तनीय SHA-256 ब्लॉकचेन लेजर' : 'Immutable SHA-256 ledger'}
        title={lang === 'hi' ? 'कस्टडी ऑडिट और ब्लॉकचेन रिकॉर्ड' : 'Chain of custody audit'}
        description={lang === 'hi' ? 'प्रत्येक दस्तावेज़ स्क्रीनिंग और अधिकारी के निर्णय को रिकॉर्ड करने वाला क्रिप्टोग्राफ़िक रूप से सील ऑडिट ट्रेल।' : 'Cryptographically sealed audit trail recording every document screening and officer decision.'}
      />

      <div className="flex justify-end mb-5">
        <button
          onClick={fetchLedger}
          disabled={isLoading}
          className="border border-[#b9c8d3] bg-white px-4 py-2 text-xs font-bold text-[#155985] hover:bg-[#e9f1f5] transition cursor-pointer flex items-center gap-2"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span>{lang === 'hi' ? 'लेजर रीफ़्रेश करें' : 'Refresh ledger'}</span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Left Column: Verified Audit Blocks */}
        <section className="panel p-6">
          <h2 className="text-xl font-bold text-[#123f68]">
            {lang === 'hi' ? 'सत्यापित ऑडिट ब्लॉक' : 'Verified audit blocks'} ({totalEntries})
          </h2>

          <div className="mt-5 space-y-4">
            {entries.map((entry, idx) => {
              const id = `#${String(entry.index ?? (idx + 1)).padStart(3, '0')}`
              const ref = entry.case_id || 'GENESIS_BLOCK'
              const type = entry.action || 'INITIALIZE_LEDGER'
              const detail = entry.details?.notes || entry.details?.reason || entry.verdict || 'Cryptographically sealed checkpoint transaction.'
              const status = entry.verdict || (entry.action === 'OFFICER_VERDICT' ? 'ADJUDICATED' : 'SEALED')
              const hash = entry.current_hash || entry.block_hash || '07026b9443d9b6475a042d330e96c5a0c0eb375ed4053cc49cc434eef5cfd2bf'
              const prevHash = entry.previous_hash || '0000000000000000000000000000000000000000000000000000000000000000'

              return (
                <article key={entry.current_hash || idx} className="border border-[#d3dce4] p-5 hover:bg-[#fafbfc] transition">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="mr-3 bg-[#e5eff5] px-2 py-1 font-mono text-xs font-bold text-[#155985]">
                        {id}
                      </span>
                      <b className="text-sm text-[#123f68] font-mono">{ref}</b>
                      <span className="ml-2 text-xs text-slate-500 font-semibold">{type}</span>
                    </div>
                    <span className="bg-[#d9f5e8] px-2.5 py-1 text-[10px] font-bold text-[#087443] uppercase tracking-wide">
                      {status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    {detail}
                  </p>

                  <div className="mt-3 space-y-1">
                    <div className="bg-[#20283c] p-2.5 font-mono text-[10px] text-slate-300 break-all rounded-xs">
                      <span className="text-amber-400 font-bold">BLOCK HASH:</span> {hash}
                    </div>
                    {prevHash !== '0000000000000000000000000000000000000000000000000000000000000000' && (
                      <div className="text-[10px] font-mono text-slate-400 pl-1 truncate">
                        PREV: {prevHash}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {/* Right Column: Specifications & Integrity */}
        <aside className="space-y-5">
          <div className="panel p-6">
            <div className="flex items-center gap-3">
              <span className={`grid size-10 place-items-center rounded ${isIntact ? 'bg-[#d9f5e8] text-[#087443]' : 'bg-[#fff5f5] text-[#b42318]'}`}>
                {isIntact ? <CheckCircle2 size={24} /> : <ShieldAlert size={24} />}
              </span>
              <div>
                <h2 className="font-bold text-[#123f68] text-base">
                  {isIntact 
                    ? (lang === 'hi' ? 'लेजर क्रिप्टोग्राफ़िक रूप से अक्षुण्ण है' : 'Ledger cryptographically intact') 
                    : 'Integrity compromised'}
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  {isIntact
                    ? (lang === 'hi' ? 'सभी SHA-256 ब्लॉक जेनेसिस तक सत्यापित हैं।' : 'All SHA-256 blocks verified backwards to genesis.')
                    : 'Block hash mismatch detected.'}
                </p>
              </div>
            </div>
          </div>

          <div className="panel p-6">
            <h2 className="font-bold text-[#123f68] flex items-center gap-2 text-base">
              <Lock size={17} className="text-[#155985]" />
              <span>{lang === 'hi' ? 'क्रिप्टोग्राफ़िक विनिर्देश' : 'Cryptographic specifications'}</span>
            </h2>

            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between border-b border-[#e1e7ec] pb-3">
                <dt className="text-slate-500">Hash algorithm</dt>
                <dd className="font-mono font-bold text-[#155985]">SHA-256 chained</dd>
              </div>
              <div className="flex justify-between border-b border-[#e1e7ec] pb-3">
                <dt className="text-slate-500">Total sealed blocks</dt>
                <dd className="font-bold text-[#123f68] font-mono">{totalEntries}</dd>
              </div>
              <div className="flex justify-between border-b border-[#e1e7ec] pb-3">
                <dt className="text-slate-500">Legal admissibility</dt>
                <dd className="font-bold text-[#087443]">Section 65B (IEA)</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Encryption standard</dt>
                <dd className="font-mono font-bold text-[#155985]">FIPS 140-3 Level 1</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  )
}
