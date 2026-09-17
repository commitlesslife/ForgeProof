import { useState } from 'react'
import { ShieldCheck, Lock, AlertCircle, UserCheck, KeyRound, ChevronRight } from 'lucide-react'
import { API_BASE } from '../config'

export default function LoginPage({ onLogin }) {
  const [officerId, setOfficerId] = useState('')
  const [password, setPassword] = useState('')
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

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-[#eef3f7] px-4 py-8 text-[#1f3347]">
      {/* Tricolor top border */}
      <div className="fixed top-0 left-0 right-0 tricolor-stripe" />

      <div className="w-full max-w-md animate-fade-in-up">
        {/* Portal Header */}
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-3">
            <span className="grid size-12 place-items-center border border-white/25 bg-[#0b3152] rounded shadow-sm text-white">
              <ShieldCheck size={28} />
            </span>
          </div>
          <div className="text-xl font-bold tracking-tight text-[#123f68]">
            ForgeProof
          </div>
          <div className="text-[11px] font-bold uppercase tracking-[.18em] text-[#155985] mt-0.5">
            National Border Operations Command Center
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Terminal 3 Immigration Checkpoint · Official Workstation
          </div>
        </div>

        {/* Login Box */}
        <div className="panel overflow-hidden">
          <div className="bg-[#123f68] border-b-2 border-[#c9922e] px-6 py-3.5 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck size={17} className="text-[#f0b429]" />
              <h1 className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                Officer Authentication
              </h1>
            </div>
            <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-blue-100 font-bold">
              FIPS 140-3
            </span>
          </div>

          <div className="p-6 sm:p-7">
            {errorMsg && (
              <div className="mb-4 flex items-center gap-2 rounded bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-[#b42318]">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="officer-id" className="text-xs font-bold text-[#123f68] block uppercase tracking-wider">
                  Officer ID / Badge Number
                </label>
                <input
                  id="officer-id"
                  autoComplete="username"
                  placeholder="e.g. admin or OFFICER_IND_829"
                  value={officerId}
                  onChange={e => setOfficerId(e.target.value)}
                  className="h-10 w-full border border-[#d3dce4] bg-white px-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#155985] outline-none transition font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-bold text-[#123f68] block uppercase tracking-wider">
                  Passcode / Security Key
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter security passcode"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-10 w-full border border-[#d3dce4] bg-white px-3 text-sm text-slate-800 placeholder-slate-400 focus:border-[#155985] outline-none transition font-medium"
                  required
                />
              </div>

              <button
                type="submit"
                className="h-11 w-full bg-[#123f68] hover:bg-[#0b3152] font-bold text-white transition text-xs uppercase tracking-wider disabled:opacity-50 mt-2 cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Authenticating credentials...
                  </span>
                ) : (
                  <>
                    <KeyRound size={15} />
                    Sign In to Workstation
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-[#e1e7ec] text-center space-y-1">
              <p className="text-[11px] font-semibold text-slate-500">
                Authorized Personnel Only · Official Secrets Act
              </p>
              <p className="text-[10px] text-slate-400">
                All logins are cryptographically logged to the immutable border audit trail.
              </p>
            </div>
          </div>
        </div>

        {/* Demo Hint */}
        <div className="mt-3 text-center">
          <p className="text-[11px] text-slate-500">
            Reviewer Demo Key: <strong className="font-mono text-slate-700">admin</strong> / <strong className="font-mono text-slate-700">admin123</strong>
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 tricolor-stripe" />
    </main>
  )
}
