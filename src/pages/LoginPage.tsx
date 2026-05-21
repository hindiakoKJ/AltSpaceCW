import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/layout/Logo'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [mode,      setMode]      = useState<'login' | 'signup' | 'forgot'>('login')
  const [workspace, setWorkspace] = useState(searchParams.get('workspace') ?? '')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [name,      setName]      = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [error,     setError]     = useState('')
  const [info,      setInfo]      = useState('')
  const [loading,   setLoading]   = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error, profile } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    if (profile?.role === 'console') {
      navigate('/console', { replace: true })
    } else if (profile?.role === 'admin' && profile.tenant?.slug) {
      navigate(`/${profile.tenant.slug}/admin`, { replace: true })
    } else if (profile?.tenant?.slug) {
      navigate(`/${profile.tenant.slug}`, { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!workspace.trim())       { setError('Workspace ID is required.'); return }
    if (password !== confirm)    { setError('Passwords do not match.'); return }
    if (password.length < 6)     { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    const { error } = await signUp(email, password, name, workspace.trim())
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setInfo('Check your email for a confirmation link, then sign in.')
      setMode('login')
      setPassword('')
      setConfirm('')
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setInfo('Check your email — a password reset link has been sent.')
    }
  }

  function switchMode(next: 'login' | 'signup' | 'forgot') {
    setMode(next); setError(''); setInfo(''); setPassword(''); setConfirm('')
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
          <h1 className="font-serif text-2xl text-slate-900">
            {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === 'login' ? 'Sign in to your workspace.' : mode === 'signup' ? 'Get started with AltSpaceCW.' : 'We\'ll email you a reset link.'}
          </p>

          {info && (
            <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{info}</div>
          )}

          {/* Hidden honeypot inputs — trick browser autofill away from workspace field */}
          <input type="text"  style={{ display: 'none' }} autoComplete="username" readOnly />
          <input type="email" style={{ display: 'none' }} autoComplete="email"    readOnly />

          {/* ── Forgot password form ── */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="mt-6 space-y-4">
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@example.com"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white" />
              </div>
              {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>}
              <button type="submit" disabled={loading}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
              <button type="button" onClick={() => switchMode('login')}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-stone-50">
                ← Back to sign in
              </button>
            </form>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className={`mt-6 space-y-4 ${mode === 'forgot' ? 'hidden' : ''}`}>

            {/* Workspace ID — always shown */}
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Workspace ID</label>
              <input
                type="text"
                name="workspace-id"
                autoComplete="organization"
                value={workspace}
                onChange={e => setWorkspace(e.target.value)}
                required={mode === 'signup'}
                placeholder="your-workspace-id"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-stone-50 px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                {mode === 'signup' ? 'Provided by your co-working space.' : 'Leave blank if signing in to console.'}
              </p>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Full name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Juan dela Cruz"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white" />
              </div>
            )}

            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white" />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Password</label>
                {mode === 'login' && (
                  <button type="button" onClick={() => switchMode('forgot')}
                    className="text-[11px] text-slate-400 hover:text-slate-700 hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white" />
            </div>

            {mode === 'signup' && (
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Confirm password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-stone-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white" />
              </div>
            )}

            {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>}

            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
              {loading
                ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                : (mode === 'login' ? 'Sign in'     : 'Create account')}
            </button>
          </form>

          {mode !== 'forgot' && (
            <p className="mt-6 text-center text-sm text-slate-500">
              {mode === 'login' ? (
                <>No account?{' '}
                  <button onClick={() => switchMode('signup')} className="font-medium text-slate-900 hover:underline">Sign up</button>
                </>
              ) : (
                <>Already have one?{' '}
                  <button onClick={() => switchMode('login')} className="font-medium text-slate-900 hover:underline">Sign in</button>
                </>
              )}
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">© 2026 HNSCorpPH · AltSpaceCW</p>
      </div>
    </div>
  )
}
