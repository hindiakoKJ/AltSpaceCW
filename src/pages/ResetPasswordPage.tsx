import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/layout/Logo'

export default function ResetPasswordPage() {
  const navigate = useNavigate()

  const [ready,    setReady]    = useState(false)   // session from URL hash confirmed
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [done,     setDone]     = useState(false)

  // Supabase sends the recovery token in the URL hash.
  // onAuthStateChange fires PASSWORD_RECOVERY once the hash is consumed.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6)    { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm)    { setError('Passwords do not match.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setDone(true)
      setTimeout(() => navigate('/login', { replace: true }), 2500)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F4EF] p-4">
      <div className="w-full max-w-sm">

        <div className="mb-8 flex flex-col items-center">
          <div className="flex items-center gap-2.5">
            <Logo />
            <div className="text-left leading-none">
              <div className="font-serif text-[22px] tracking-tight text-slate-900">AltSpaceCW</div>
              <div className="-mt-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-500">Where great work happens</div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <h1 className="font-serif text-2xl text-slate-900">Set new password</h1>
          <p className="mt-1 text-sm text-slate-500">Choose a new password for your account.</p>

          {done ? (
            <div className="mt-6 rounded-xl bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
              ✓ Password updated! Redirecting to sign in…
            </div>
          ) : !ready ? (
            <div className="mt-6 rounded-xl bg-amber-50 px-4 py-4 text-sm text-amber-700">
              Verifying your reset link… If this takes too long, request a new one.
              <div className="mt-3">
                <button
                  onClick={() => navigate('/login')}
                  className="text-xs font-medium text-amber-900 underline"
                >
                  ← Back to sign in
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </div>

              {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">© 2026 HNSCorpPH · AltSpaceCW</p>
      </div>
    </div>
  )
}
