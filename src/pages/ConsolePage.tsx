import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Icon } from '../components/ui/Icon'
import { Logo } from '../components/layout/Logo'
import type { Tenant } from '../types/app'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any

interface TenantProfile {
  id: string
  full_name: string
  email: string | null
  role: string
  tenant_id: string | null
  created_at: string
  tenant?: { name: string; slug: string } | null
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

type ConsoleTab = 'tenants' | 'users'

export default function ConsolePage() {
  const { signOut } = useAuth()
  const [tab,     setTab]     = useState<ConsoleTab>('tenants')
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [users,   setUsers]   = useState<TenantProfile[]>([])
  const [loading, setLoading] = useState(true)

  // New tenant modal
  const [showModal,   setShowModal]   = useState(false)
  const [newName,     setNewName]     = useState('')
  const [newSlug,     setNewSlug]     = useState('')
  const [newEmail,    setNewEmail]    = useState('')
  const [saving,      setSaving]      = useState(false)
  const [modalError,  setModalError]  = useState('')

  // Assign user modal
  const [assignUser,      setAssignUser]      = useState<TenantProfile | null>(null)
  const [assignTenantId,  setAssignTenantId]  = useState('')
  const [assignRole,      setAssignRole]      = useState('client')
  const [assigning,       setAssigning]       = useState(false)

  // Create user modal
  const [showCreateUser,    setShowCreateUser]    = useState(false)
  const [cuFullName,        setCuFullName]        = useState('')
  const [cuEmail,           setCuEmail]           = useState('')
  const [cuPassword,        setCuPassword]        = useState('')
  const [cuTenantId,        setCuTenantId]        = useState('')
  const [cuRole,            setCuRole]            = useState('client')
  const [cuSaving,          setCuSaving]          = useState(false)
  const [cuError,           setCuError]           = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: t }, { data: u }] = await Promise.all([
      sb.from('tenants').select('*').order('created_at', { ascending: false }).range(0, 199),
      sb.from('profiles').select('*, tenant:tenants(name, slug)').order('created_at', { ascending: false }).range(0, 499),
    ])
    setTenants((t as Tenant[]) ?? [])
    setUsers((u as TenantProfile[]) ?? [])
    setLoading(false)
  }

  async function createTenant() {
    if (!newName.trim() || !newSlug.trim()) { setModalError('Name and slug are required.'); return }
    setSaving(true)
    setModalError('')
    const { error } = await sb.from('tenants').insert({
      name:        newName.trim(),
      slug:        newSlug.trim(),
      status:      'active',
      admin_email: newEmail.trim() || null,
    })
    setSaving(false)
    if (error) { setModalError(error.message); return }
    setShowModal(false)
    setNewName(''); setNewSlug(''); setNewEmail('')
    loadAll()
  }

  async function toggleStatus(tenant: Tenant) {
    const next = tenant.status === 'active' ? 'suspended' : 'active'
    await sb.from('tenants').update({ status: next }).eq('id', tenant.id)
    loadAll()
  }

  async function createUser() {
    if (!cuFullName.trim() || !cuEmail.trim() || !cuPassword.trim()) {
      setCuError('Full name, email, and password are required.')
      return
    }
    if (cuPassword.length < 6) {
      setCuError('Password must be at least 6 characters.')
      return
    }
    setCuSaving(true)
    setCuError('')

    const { data, error } = await sb.functions.invoke('create-user', {
      body: {
        email:     cuEmail.trim(),
        password:  cuPassword,
        full_name: cuFullName.trim(),
        tenant_id: cuTenantId || null,
        role:      cuRole,
      },
    })

    setCuSaving(false)

    if (error) {
      setCuError(error.message ?? 'Failed to create user')
      return
    }
    if (data?.error) {
      setCuError(data.error)
      return
    }

    // Success — close and refresh
    setShowCreateUser(false)
    setCuFullName(''); setCuEmail(''); setCuPassword('')
    setCuTenantId(''); setCuRole('client'); setCuError('')
    loadAll()
  }

  async function assignUserToTenant() {
    if (!assignUser) return
    setAssigning(true)
    await sb.from('profiles').update({
      tenant_id: assignTenantId || null,
      role:      assignRole,
    }).eq('id', assignUser.id)
    setAssigning(false)
    setAssignUser(null)
    loadAll()
  }

  const active    = tenants.filter(t => t.status === 'active').length
  const suspended = tenants.filter(t => t.status === 'suspended').length

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <header className="border-b border-white/10 px-8 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <div className="leading-none">
              <div className="font-serif text-lg text-white">HNSCorpPH</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">Platform Console</div>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:border-white/20 hover:text-white/80"
          >
            <Icon name="LogOut" size={12} />
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-8 py-8">

        {/* Tabs */}
        <div className="mb-8 flex gap-1 rounded-full border border-white/10 bg-white/5 p-1 w-fit">
          {(['tenants', 'users'] as ConsoleTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
                tab === t ? 'bg-white text-slate-900' : 'text-white/60 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── TENANTS TAB ────────────────────────────────────── */}
        {tab === 'tenants' && (
          <>
            {/* Stats */}
            <div className="mb-6 grid grid-cols-3 gap-4">
              {[
                { label: 'Total',     value: tenants.length, color: 'text-white' },
                { label: 'Active',    value: active,         color: 'text-emerald-400' },
                { label: 'Suspended', value: suspended,      color: 'text-amber-400' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                  <div className="text-xs uppercase tracking-wider text-white/40">{s.label}</div>
                  <div className={`mt-1 font-serif text-3xl ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Table header */}
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-serif text-xl text-white">Tenants</h2>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400"
              >
                <Icon name="Plus" size={14} />
                New tenant
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Business</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Slug</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Admin email</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Created</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-white/40">Loading…</td></tr>
                  ) : tenants.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-white/40">No tenants yet. Create one to get started.</td></tr>
                  ) : tenants.map(t => (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-5 py-4 font-medium text-white">{t.name}</td>
                      <td className="px-5 py-4 font-mono text-xs text-white/60">{t.slug}</td>
                      <td className="px-5 py-4 text-white/60">{t.admin_email || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          t.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${t.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          {t.status === 'active' ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-white/40">
                        {new Date(t.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => toggleStatus(t)}
                          className="rounded-lg border border-white/10 px-3 py-1 text-xs text-white/60 hover:border-white/20 hover:text-white"
                        >
                          {t.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── USERS TAB ──────────────────────────────────────── */}
        {tab === 'users' && (
          <>
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="font-serif text-xl text-white">Users</h2>
                <p className="mt-1 text-sm text-white/40">Assign users to tenants and set their roles.</p>
              </div>
              <button
                onClick={() => setShowCreateUser(true)}
                className="flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400"
              >
                <Icon name="Plus" size={14} />
                Create user
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Name</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Email</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Role</th>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/40">Tenant</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="px-5 py-8 text-center text-white/40">Loading…</td></tr>
                  ) : users.map(u => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-5 py-4 font-medium text-white">{u.full_name || '—'}</td>
                      <td className="px-5 py-4 text-white/60">{u.email}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          u.role === 'console' ? 'bg-violet-500/10 text-violet-400'
                          : u.role === 'admin' ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-white/5 text-white/60'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-white/60">
                        {u.tenant?.name ?? <span className="text-white/30">Unassigned</span>}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            setAssignUser(u)
                            setAssignTenantId(u.tenant_id ?? '')
                            setAssignRole(u.role)
                          }}
                          className="rounded-lg border border-white/10 px-3 py-1 text-xs text-white/60 hover:border-white/20 hover:text-white"
                        >
                          Assign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── New Tenant Modal ────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8">
            <h2 className="font-serif text-xl text-white">New tenant</h2>
            <p className="mt-1 text-sm text-white/50">Onboard a new co-working space.</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">Business name</label>
                <input
                  value={newName}
                  onChange={e => { setNewName(e.target.value); setNewSlug(toSlug(e.target.value)) }}
                  placeholder="BGC Desk Co."
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">Slug</label>
                <input
                  value={newSlug}
                  onChange={e => setNewSlug(e.target.value)}
                  placeholder="bgc-desk-co"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-white outline-none focus:border-white/20"
                />
                <p className="mt-1 text-xs text-white/30">Used in the URL: altspacecw.hnscorpph.com/{newSlug || 'slug'}</p>
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">Admin email <span className="normal-case text-white/20">(optional)</span></label>
                <input
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  type="email"
                  placeholder="owner@example.com"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
                />
              </div>
              {modalError && <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{modalError}</p>}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setShowModal(false); setNewName(''); setNewSlug(''); setNewEmail(''); setModalError('') }}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-white/60 hover:border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={createTenant}
                disabled={saving}
                className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-slate-900 hover:bg-amber-400 disabled:opacity-50"
              >
                {saving ? 'Creating…' : 'Create tenant'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create User Modal ──────────────────────────────── */}
      {showCreateUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8">
            <h2 className="font-serif text-xl text-white">Create user</h2>
            <p className="mt-1 text-sm text-white/50">New user will be able to log in immediately.</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">Full name</label>
                <input
                  value={cuFullName}
                  onChange={e => setCuFullName(e.target.value)}
                  placeholder="Jane Santos"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">Email</label>
                <input
                  value={cuEmail}
                  onChange={e => setCuEmail(e.target.value)}
                  type="email"
                  placeholder="jane@example.com"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">Password <span className="normal-case text-white/20">(min 6 chars)</span></label>
                <input
                  value={cuPassword}
                  onChange={e => setCuPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">Tenant</label>
                <select
                  value={cuTenantId}
                  onChange={e => setCuTenantId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
                >
                  <option value="">— None (unassigned)</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">Role</label>
                <select
                  value={cuRole}
                  onChange={e => setCuRole(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
                >
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {cuError && <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{cuError}</p>}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowCreateUser(false)
                  setCuFullName(''); setCuEmail(''); setCuPassword('')
                  setCuTenantId(''); setCuRole('client'); setCuError('')
                }}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-white/60 hover:border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={createUser}
                disabled={cuSaving}
                className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-slate-900 hover:bg-amber-400 disabled:opacity-50"
              >
                {cuSaving ? 'Creating…' : 'Create user'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign User Modal ───────────────────────────────── */}
      {assignUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-8">
            <h2 className="font-serif text-xl text-white">Assign user</h2>
            <p className="mt-1 text-sm text-white/50">{assignUser.full_name} · {assignUser.email}</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">Tenant</label>
                <select
                  value={assignTenantId}
                  onChange={e => setAssignTenantId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
                >
                  <option value="">— None (unassigned)</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">Role</label>
                <select
                  value={assignRole}
                  onChange={e => setAssignRole(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/20"
                >
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setAssignUser(null)}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-white/60 hover:border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={assignUserToTenant}
                disabled={assigning}
                className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-slate-900 hover:bg-amber-400 disabled:opacity-50"
              >
                {assigning ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
