import { useApp } from '../../context/AppContext'
import type { ViewType } from '../../types/app'
import { Avatar } from '../ui/Avatar'
import { Icon } from '../ui/Icon'
import { Logo } from './Logo'
import { CURRENT_USER } from '../../lib/mockData'

const CLIENT_TABS: { id: ViewType; label: string; icon: string }[] = [
  { id: 'book',      label: 'Book a space', icon: 'Calendar'   },
  { id: 'dashboard', label: 'My bookings',  icon: 'LayoutGrid' },
]

const ADMIN_TAB = { id: 'admin' as ViewType, label: 'Operator', icon: 'ShieldCheck' }

export function TopNav() {
  const app  = useApp()
  const tabs = app.userRole === 'admin' ? [...CLIENT_TABS, ADMIN_TAB] : CLIENT_TABS

  // If user loses admin role while on admin view, redirect to book
  function handleRoleToggle() {
    const next = app.userRole === 'admin' ? 'client' : 'admin'
    app.setUserRole(next)
    if (next === 'client' && app.view === 'admin') app.setView('book')
  }

  return (
    <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#F6F4EF]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-8 py-4">

        {/* Brand */}
        <button onClick={() => app.setView('book')} className="flex items-center gap-2.5">
          <Logo />
          <div className="text-left leading-none">
            <div className="font-serif text-[22px] tracking-tight text-slate-900">AltSpaceCW</div>
            <div className="-mt-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-500">Where great work happens</div>
          </div>
        </button>

        {/* Desktop tabs */}
        <nav className="ml-6 hidden items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-soft md:flex">
          {tabs.map(t => {
            const active = app.view === t.id
            const isAdmin = t.id === 'admin'
            return (
              <button
                key={t.id}
                onClick={() => app.setView(t.id)}
                className={`relative flex items-center gap-2 rounded-full px-3.5 py-2 text-sm transition ${
                  active ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon name={t.icon} size={14} />
                <span className="font-medium">{t.label}</span>
                {isAdmin && (
                  <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                    active ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-700'
                  }`}>
                    Admin
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Right */}
        <div className="ml-auto flex items-center gap-3">
          {/* Live status */}
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 lg:flex">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 pulse-dot" />
            <span className="text-xs text-slate-700">Studio open · 18 of 31 in</span>
          </div>

          {/* ── Demo role switcher ──────────────────────────────────
              In production this is replaced by the real Supabase
              profile.role. This pill only exists for prototype demo.
          ─────────────────────────────────────────────────────────── */}
          <button
            onClick={handleRoleToggle}
            title="Demo only — toggle between Client and Admin role"
            className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition md:flex ${
              app.userRole === 'admin'
                ? 'border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            <Icon name={app.userRole === 'admin' ? 'ShieldCheck' : 'User'} size={12} />
            {app.userRole === 'admin' ? 'Admin' : 'Client'}
          </button>

          <button className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:border-slate-300">
            <Icon name="Bell" size={16} />
          </button>
          <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-1 pr-3 py-1 hover:border-slate-300">
            <Avatar member={CURRENT_USER} size={28} />
            <span className="hidden text-sm font-medium text-slate-900 sm:block">Maya</span>
            <Icon name="ChevronDown" size={14} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="flex gap-1 overflow-x-auto border-t border-slate-200/70 px-4 py-2 md:hidden">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => app.setView(t.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm ${
              app.view === t.id ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            <Icon name={t.icon} size={14} />
            {t.label}
          </button>
        ))}
        {/* Mobile role toggle */}
        <button
          onClick={handleRoleToggle}
          className={`ml-auto flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold ${
            app.userRole === 'admin'
              ? 'border-amber-400 bg-amber-50 text-amber-800'
              : 'border-slate-200 text-slate-600'
          }`}
        >
          <Icon name={app.userRole === 'admin' ? 'ShieldCheck' : 'User'} size={12} />
          {app.userRole === 'admin' ? 'Admin' : 'Client'}
        </button>
      </div>
    </div>
  )
}
