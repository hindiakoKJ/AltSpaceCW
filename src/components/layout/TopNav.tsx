import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useTenant } from '../../context/TenantContext'
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
  const app     = useApp()
  const { user, profile, signOut } = useAuth()
  const { tenant } = useTenant()
  const navigate  = useNavigate()
  const tabs = app.userRole === 'admin' ? [...CLIENT_TABS, ADMIN_TAB] : CLIENT_TABS
  const displayName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'You'

  return (
    <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#F6F4EF]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-8 py-4">

        {/* Brand */}
        <button onClick={() => app.setView('book')} className="flex items-center gap-2.5">
          <Logo />
          <div className="text-left leading-none">
            <div className="font-serif text-[22px] tracking-tight text-slate-900">
              {tenant?.name ?? 'AltSpaceCW'}
            </div>
            <div className="-mt-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-500">Where great work happens</div>
          </div>
        </button>

        {/* Desktop tabs */}
        <nav className="ml-6 hidden items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-soft md:flex">
          {tabs.map(t => {
            const active  = app.view === t.id
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
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 lg:flex">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 pulse-dot" />
            <span className="text-xs text-slate-700">Studio open · {tenant?.name ?? 'AltSpaceCW'}</span>
          </div>

          <button className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:border-slate-300">
            <Icon name="Bell" size={16} />
          </button>

          <div className="relative group">
            <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-1 pr-3 py-1 hover:border-slate-300">
              <Avatar member={CURRENT_USER} size={28} />
              <span className="hidden text-sm font-medium text-slate-900 sm:block">{displayName}</span>
              <Icon name="ChevronDown" size={14} className="text-slate-400" />
            </button>
            <div className="absolute right-0 top-full mt-1.5 hidden w-48 rounded-2xl border border-slate-200 bg-white py-1.5 shadow-lg group-focus-within:block group-hover:block">
              {profile?.role === 'admin' && (
                <button
                  onClick={() => navigate('/console')}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-stone-50"
                >
                  <Icon name="Terminal" size={14} />
                  Console
                </button>
              )}
              <button
                onClick={() => signOut()}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-stone-50"
              >
                <Icon name="LogOut" size={14} />
                Sign out
              </button>
            </div>
          </div>
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
      </div>
    </div>
  )
}
