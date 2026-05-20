import { Logo } from './Logo'
import { useApp } from '../../context/AppContext'
import { useTenant } from '../../context/TenantContext'

export function Footer() {
  const app    = useApp()
  const { tenant } = useTenant()
  const studioName   = app.studioSettings?.name ?? tenant?.name ?? 'AltSpaceCW'
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200/70 bg-stone-50/60 py-8">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">

        {/* Top row */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Logo />
            <span>© {year} HNSCorpPH · AltSpaceCW</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-slate-900">House rules</a>
            <a href="/privacy" className="hover:text-slate-900">Privacy</a>
            <a href="/contact" className="hover:text-slate-900">Support</a>
            <span className="font-mono">v 4.18.0</span>
          </div>
        </div>

        {/* Operator disclaimer */}
        <div className="mt-4 border-t border-slate-200/60 pt-4 text-[11px] text-slate-400">
          This booking platform is operated by{' '}
          <span className="font-medium text-slate-600">{studioName}</span>
          {tenant?.name && studioName !== tenant.name && (
            <> ({tenant.name})</>
          )}
          . AltSpaceCW provides the booking infrastructure on their behalf.
          All space availability, pricing, and membership terms are set by the operator.
        </div>

      </div>
    </footer>
  )
}
