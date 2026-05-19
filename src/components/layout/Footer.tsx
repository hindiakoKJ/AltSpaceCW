import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="border-t border-slate-200/70 bg-stone-50/60 py-8">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-8 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Logo />
          <span>© 2026 HNSCorpPH · AltSpaceCW</span>
        </div>
        <div className="flex items-center gap-5">
          <a href="#" className="hover:text-slate-900">House rules</a>
          <a href="#" className="hover:text-slate-900">Privacy</a>
          <a href="#" className="hover:text-slate-900">Support</a>
          <span className="font-mono">v 4.18.0</span>
        </div>
      </div>
    </footer>
  )
}
