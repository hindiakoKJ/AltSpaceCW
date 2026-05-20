import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Icon } from '../ui/Icon'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any

interface Props { onClose: () => void }

export function ProfileModal({ onClose }: Props) {
  const { user, profile } = useAuth()

  const [tab, setTab] = useState<'info' | 'password'>('info')

  /* ── Info tab state ───────────────────────────────────────────── */
  const [fullName,   setFullName]   = useState(profile?.full_name ?? '')
  const [infoSaving, setInfoSaving] = useState(false)
  const [infoMsg,    setInfoMsg]    = useState<{ ok: boolean; text: string } | null>(null)

  async function saveInfo() {
    if (!fullName.trim()) return
    setInfoSaving(true)
    setInfoMsg(null)
    const { error } = await sb
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', user?.id)
    setInfoSaving(false)
    setInfoMsg(error
      ? { ok: false, text: error.message }
      : { ok: true,  text: 'Profile updated. Changes appear on your next page load.' }
    )
  }

  /* ── Password tab state ───────────────────────────────────────── */
  const [newPw,      setNewPw]      = useState('')
  const [confirmPw,  setConfirmPw]  = useState('')
  const [showPw,     setShowPw]     = useState(false)
  const [pwSaving,   setPwSaving]   = useState(false)
  const [pwMsg,      setPwMsg]      = useState<{ ok: boolean; text: string } | null>(null)

  async function savePassword() {
    if (newPw.length < 6)        { setPwMsg({ ok: false, text: 'Password must be at least 6 characters.' }); return }
    if (newPw !== confirmPw)     { setPwMsg({ ok: false, text: 'Passwords do not match.' }); return }
    setPwSaving(true)
    setPwMsg(null)
    const { error } = await sb.auth.updateUser({ password: newPw })
    setPwSaving(false)
    if (error) {
      setPwMsg({ ok: false, text: error.message })
    } else {
      setPwMsg({ ok: true, text: 'Password changed successfully.' })
      setNewPw('')
      setConfirmPw('')
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-soft-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">Account</div>
            <h2 className="mt-0.5 text-xl font-semibold text-slate-900">My profile</h2>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-stone-100">
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Email (read-only) */}
        <div className="border-b border-slate-100 bg-stone-50 px-6 py-3">
          <div className="text-[11px] text-slate-400">Signed in as</div>
          <div className="text-sm font-medium text-slate-700">{user?.email}</div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-slate-100 px-6">
          {(['info', 'password'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px mr-6 border-b-2 py-3 text-sm font-medium transition ${
                tab === t
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              {t === 'info' ? 'Personal info' : 'Change password'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'info' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-900">Full name</label>
                <input
                  value={fullName}
                  onChange={e => { setFullName(e.target.value); setInfoMsg(null) }}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-slate-200 bg-[#F6F4EF] px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition"
                />
              </div>

              {infoMsg && (
                <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm ${
                  infoMsg.ok
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}>
                  <Icon name={infoMsg.ok ? 'CheckCircle2' : 'AlertCircle'} size={14} />
                  {infoMsg.text}
                </div>
              )}

              <button
                onClick={saveInfo}
                disabled={infoSaving || !fullName.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:bg-slate-300 transition"
              >
                {infoSaving && <Icon name="Loader" size={14} className="animate-spin" />}
                {infoSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          )}

          {tab === 'password' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-900">New password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={newPw}
                    onChange={e => { setNewPw(e.target.value); setPwMsg(null) }}
                    placeholder="Min. 6 characters"
                    className="w-full rounded-xl border border-slate-200 bg-[#F6F4EF] px-4 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <Icon name={showPw ? 'EyeOff' : 'Eye'} size={15} />
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-900">Confirm password</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={e => { setConfirmPw(e.target.value); setPwMsg(null) }}
                  placeholder="Repeat new password"
                  className="w-full rounded-xl border border-slate-200 bg-[#F6F4EF] px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition"
                />
              </div>

              {pwMsg && (
                <div className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm ${
                  pwMsg.ok
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}>
                  <Icon name={pwMsg.ok ? 'CheckCircle2' : 'AlertCircle'} size={14} />
                  {pwMsg.text}
                </div>
              )}

              <button
                onClick={savePassword}
                disabled={pwSaving || !newPw || !confirmPw}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:bg-slate-300 transition"
              >
                {pwSaving && <Icon name="Loader" size={14} className="animate-spin" />}
                {pwSaving ? 'Updating…' : 'Update password'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
