import { useState } from 'react'
import { ShieldCheck, Sparkles, AlertCircle, KeyRound, UserCheck } from 'lucide-react'
import { API_BASE } from '../config'

export default function LoginPage({ onLogin }) {
  const [officerId, setOfficerId] = useState('admin')
  const [password, setPassword] = useState('admin')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')

    try {
      const response = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officer_id: officerId.trim(), password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed. Please verify credentials.')
      }

      onLogin(data.officer, data.token)
    } catch (err) {
      console.error('Login error:', err)
      setErrorMsg(err.message || 'Could not connect to authentication service.')
    } finally {
      setIsLoading(false)
    }
  }

  const setDemoCredentials = (id, pwd) => {
    setOfficerId(id)
    setPassword(pwd)
    setErrorMsg('')
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        <div className="mb-5 flex items-center justify-center gap-2 text-sm font-bold text-[#0B477A]">
          <span className="flex size-9 items-center justify-center rounded-xl glass-navy text-white">
            <ShieldCheck size={19} />
          </span>
          ForgeProof Identity & Border Security
        </div>

        <div className="glass-effect rounded-[24px] sm:rounded-[30px] p-0 shadow-2xl border border-white/70">
          <div className="space-y-4 pb-4 pt-7 sm:pt-8 text-center px-5 sm:px-8">
            <div className="mx-auto flex size-14 sm:size-16 items-center justify-center rounded-[20px] sm:rounded-[22px] glass-navy-subtle text-[#0B477A]">
              <Sparkles size={25} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B477A]">Officer Portal</h1>
              <p className="mt-1 text-[#615D73] text-xs sm:text-sm">Sign in to access official screening workstation.</p>
            </div>
          </div>

          {/* Quick preset credential selector */}
          <div className="px-5 sm:px-8 pt-1 sm:pt-2">
            <div className="rounded-2xl glass-card border border-white/80 p-3 text-xs text-[#615D73] space-y-1.5">
              <p className="font-bold text-[#0B477A] flex items-center gap-1.5">
                <KeyRound size={13} /> Quick Fill Credentials:
              </p>
              <div className="flex flex-col xs:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setDemoCredentials('admin', 'admin')}
                  className={`flex-1 py-2 sm:py-1.5 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer active:scale-98 text-center ${
                    officerId === 'admin' 
                      ? 'glass-navy text-white shadow-xs font-bold' 
                      : 'bg-white/70 hover:bg-white text-[#615D73] border-[#615D73]/20'
                  }`}
                >
                  Admin Bypass
                </button>
                <button
                  type="button"
                  onClick={() => setDemoCredentials('OFFICER_IND_829', 'border-secure-2026')}
                  className={`flex-1 py-2 sm:py-1.5 px-2 rounded-xl text-xs font-semibold border transition cursor-pointer active:scale-98 text-center ${
                    officerId === 'OFFICER_IND_829' 
                      ? 'glass-navy text-white shadow-xs font-bold' 
                      : 'bg-white/70 hover:bg-white text-[#615D73] border-[#615D73]/20'
                  }`}
                >
                  Inspector IND-829
                </button>
              </div>
            </div>
          </div>

          <div className="px-5 sm:px-8 pb-7 sm:pb-8 pt-3 sm:pt-4">
            {errorMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-[#D30B0D]/30 p-3 text-xs font-semibold text-[#D30B0D] animate-shake">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="officer-id" className="text-xs font-bold text-[#0B477A] block uppercase tracking-wider">Officer ID / Badge</label>
                <input
                  id="officer-id"
                  autoComplete="username"
                  placeholder="e.g. admin or OFFICER_IND_829"
                  value={officerId}
                  onChange={e => setOfficerId(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#615D73]/25 bg-white/80 px-4 text-[#0B477A] placeholder-[#615D73]/50 focus:border-[#0B477A] focus:ring-2 focus:ring-[#0B477A]/25 outline-none transition text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-bold text-[#0B477A] uppercase tracking-wider">Password</label>
                  <span className="text-[11px] text-[#615D73]">Default: admin</span>
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter officer security key"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#615D73]/25 bg-white/80 px-4 text-[#0B477A] placeholder-[#615D73]/50 focus:border-[#0B477A] focus:ring-2 focus:ring-[#0B477A]/25 outline-none transition text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                className="h-12 w-full rounded-xl bg-[#D30B0D] hover:bg-[#B3090B] font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-50 mt-2 shadow-md shadow-[#D30B0D]/25 cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Authenticating credentials...
                  </span>
                ) : (
                  <>
                    <UserCheck size={18} />
                    Sign in to workstation
                  </>
                )}
              </button>
            </form>
            <p className="mt-5 text-center text-xs leading-relaxed text-[#615D73]">
              Government Border Screening System · Authorized Personnel Only
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
