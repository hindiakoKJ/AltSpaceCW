import { Link } from 'react-router-dom'
import { Logo } from '../components/layout/Logo'
import { Icon } from '../components/ui/Icon'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F6F4EF]">

      {/* ─── Nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-[#F6F4EF]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo />
            <div className="text-left leading-none">
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-xl text-slate-900">AltSpace</span>
                <span className="rounded-md bg-amber-500 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-900 leading-none">CW</span>
              </div>
              <div className="text-[10px] italic text-slate-500">a place to do the work.</div>
            </div>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features"    className="text-sm text-slate-600 transition-colors hover:text-slate-900">Features</a>
            <a href="#how-it-works" className="text-sm text-slate-600 transition-colors hover:text-slate-900">How it works</a>
            <a href="#pricing"     className="text-sm text-slate-600 transition-colors hover:text-slate-900">Pricing</a>
            <Link to="/privacy"    className="text-sm text-slate-600 transition-colors hover:text-slate-900">Privacy</Link>
            <Link to="/contact"    className="text-sm text-slate-600 transition-colors hover:text-slate-900">Contact</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300"
            >
              Sign in
            </Link>
            <Link
              to="/contact"
              className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-400"
            >
              Get a demo
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-28 pt-24 text-center">
        <div className="fade-up mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-soft">
          <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Built for co-working space operators in the Philippines
        </div>

        <h1 className="fade-up mb-6 font-serif text-[68px] leading-[1.05] tracking-tight text-slate-900" style={{ animationDelay: '0.05s' }}>
          Launch and run your{' '}
          <span className="serif-italic text-amber-700">co-working space</span>
          <br />
          — without the chaos.
        </h1>

        <p className="fade-up mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-500" style={{ animationDelay: '0.1s' }}>
          AltSpaceCW gives operators a complete platform to manage bookings, track payments, monitor floor occupancy, and delight their members — all from one dashboard.
        </p>

        <div className="fade-up flex flex-wrap items-center justify-center gap-4" style={{ animationDelay: '0.15s' }}>
          <Link
            to="/contact"
            className="rounded-full bg-slate-900 px-7 py-3.5 font-semibold text-white transition-colors hover:bg-slate-800"
          >
            Book a demo →
          </Link>
          <a
            href="#how-it-works"
            className="rounded-full border border-slate-200 bg-white px-7 py-3.5 font-semibold text-slate-700 transition-colors hover:border-slate-300"
          >
            See how it works
          </a>
        </div>

        {/* Tagline strip */}
        <div className="fade-up mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400" style={{ animationDelay: '0.2s' }}>
          {['No long-term contracts', 'Set up in a day', 'Built for PH operators'].map(t => (
            <span key={t} className="flex items-center gap-1.5">
              <Icon name="Check" size={13} className="text-emerald-500" strokeWidth={2.5} />
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ─── Dashboard preview strip ─────────────────────────────────── */}
      <section className="border-y border-slate-200 bg-slate-900 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Spaces managed',   value: '31',   unit: 'desks & rooms',    color: 'text-amber-300' },
              { label: 'Bookings today',   value: '12',   unit: 'confirmed',         color: 'text-emerald-400' },
              { label: 'Occupancy rate',   value: '68%',  unit: 'current floor',     color: 'text-white' },
              { label: 'Revenue today',    value: '₱4.2k', unit: 'collected',        color: 'text-amber-300' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                <div className="text-[10px] uppercase tracking-widest text-white/40">{s.label}</div>
                <div className={`mt-2 font-serif text-4xl leading-none ${s.color}`}>{s.value}</div>
                <div className="mt-1 text-xs text-white/40">{s.unit}</div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs uppercase tracking-widest text-white/30">
            Live operator dashboard — real-time visibility across your entire floor
          </p>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 text-center">
          <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-500">Features</div>
          <h2 className="font-serif text-5xl text-slate-900">Everything your space needs.</h2>
          <p className="mx-auto mt-4 max-w-lg text-slate-500">
            From first booking to confirmed payment — AltSpaceCW handles the operational layer so you can focus on your members.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            {
              icon: 'LayoutGrid',
              title: 'Real-time floor map',
              body: "See exactly who's sitting where, which desks are available, and flag spaces for maintenance — all updated live.",
              accent: 'bg-amber-50 text-amber-600',
            },
            {
              icon: 'CalendarDays',
              title: 'Smart booking flow',
              body: 'Members browse, pick time slots, and reserve in seconds. A built-in 30-minute payment window keeps your calendar clean.',
              accent: 'bg-emerald-50 text-emerald-600',
            },
            {
              icon: 'BadgeCheck',
              title: 'Payment confirmation',
              body: 'Clients mark payment as done. You review and confirm within your window — or the slot auto-releases. No more ghost bookings.',
              accent: 'bg-slate-100 text-slate-700',
            },
            {
              icon: 'Users',
              title: 'Member management',
              body: 'Add clients and admins directly from the console. Control who has access to which workspace, no back-and-forth emails.',
              accent: 'bg-amber-50 text-amber-600',
            },
            {
              icon: 'BarChart2',
              title: 'Occupancy analytics',
              body: 'Track daily occupancy, revenue trends, and member activity. Make data-driven decisions about your space.',
              accent: 'bg-emerald-50 text-emerald-600',
            },
            {
              icon: 'Building2',
              title: 'Multi-tenant ready',
              body: 'Run multiple co-working locations under one operator account. Each space gets its own admin, branding, and booking portal.',
              accent: 'bg-slate-100 text-slate-700',
            },
          ].map(({ icon, title, body, accent }) => (
            <div key={title} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-soft">
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}>
                <Icon name={icon} size={22} strokeWidth={1.75} />
              </div>
              <h3 className="mb-2 font-semibold text-slate-900">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it works (operator journey) ────────────────────────── */}
      <section id="how-it-works" className="border-y border-slate-200 bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-500">Operator journey</div>
            <h2 className="font-serif text-5xl text-slate-900">
              Up and running in <span className="serif-italic">one afternoon</span>.
            </h2>
          </div>

          <div className="relative grid grid-cols-1 gap-6 md:grid-cols-4">
            {[
              { step: '01', icon: 'Building2',  title: 'Set up your space',      body: 'Add your floor layout, desk types, zones, and pricing. Publish your booking portal with your own workspace slug.' },
              { step: '02', icon: 'UserPlus',   title: 'Invite your members',     body: 'Create client and admin accounts directly from the console. They log in instantly — no email verification loops.' },
              { step: '03', icon: 'Calendar',   title: 'Bookings come in',        body: 'Members browse your live floor, pick times, and reserve. You see everything on your operator dashboard in real time.' },
              { step: '04', icon: 'CheckCircle', title: 'Confirm and collect',   body: 'Review incoming payments, confirm bookings, and track daily revenue — all from the Operations tab.' },
            ].map(({ step, icon, title, body }) => (
              <div key={step} className="rounded-3xl border border-slate-200 bg-[#F6F4EF] p-7">
                <div className="mb-5 flex items-center justify-between">
                  <span className="font-serif text-6xl leading-none text-slate-200">{step}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-amber-400">
                    <Icon name={icon} size={18} strokeWidth={2} />
                  </div>
                </div>
                <h3 className="mb-2 font-semibold text-slate-900">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SaaS Pricing ────────────────────────────────────────────── */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 text-center">
          <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-500">Pricing</div>
          <h2 className="font-serif text-5xl text-slate-900">Grow at your own pace.</h2>
          <p className="mx-auto mt-4 max-w-md text-slate-500">
            No setup fees. No lock-in. Start free and upgrade as your space scales.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Starter */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
            <div className="mb-1 text-sm font-semibold uppercase tracking-widest text-slate-400">Starter</div>
            <div className="mb-1 font-serif text-5xl text-slate-900">₱1,200</div>
            <div className="mb-6 text-sm text-slate-400">per month · 1 site</div>
            <ul className="mb-8 space-y-3 text-sm text-slate-600">
              {[
                '1 co-working location',
                'Up to 50 customers',
                '+₱100 per additional 20 customers',
                'Real-time booking & floor map',
                'Payment confirmation flow',
                'Client & admin accounts',
              ].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <Icon name="Check" size={15} className="shrink-0 text-emerald-500" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/contact"
              className="block rounded-full border border-slate-200 bg-white py-3 text-center font-semibold text-slate-700 transition-colors hover:border-slate-900"
            >
              Get started
            </Link>
          </div>

          {/* Growth — popular */}
          <div className="relative rounded-3xl border-2 border-amber-400 bg-white p-8 shadow-soft-lg">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-amber-500 px-4 py-1 text-xs font-bold text-white">Most popular</span>
            </div>
            <div className="mb-1 text-sm font-semibold uppercase tracking-widest text-amber-500">Growth</div>
            <div className="mb-1 font-serif text-5xl text-slate-900">₱2,300</div>
            <div className="mb-6 text-sm text-slate-400">per month · up to 3 sites</div>
            <ul className="mb-8 space-y-3 text-sm text-slate-600">
              {[
                'Up to 3 co-working locations',
                'Up to 200 customers',
                '+₱100 per additional 20 customers',
                'Everything in Starter',
                'Occupancy analytics',
                'Priority support',
              ].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <Icon name="Check" size={15} className="shrink-0 text-emerald-500" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/contact"
              className="block rounded-full bg-slate-900 py-3 text-center font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Book a demo
            </Link>
          </div>

          {/* Enterprise */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
            <div className="mb-1 text-sm font-semibold uppercase tracking-widest text-slate-400">Enterprise</div>
            <div className="mb-1 font-serif text-5xl text-slate-900">Custom</div>
            <div className="mb-6 text-sm text-slate-400">unlimited sites · white-label</div>
            <ul className="mb-8 space-y-3 text-sm text-slate-600">
              {[
                'Unlimited locations',
                'Unlimited customers',
                'Custom domain & branding',
                'API access',
                'Dedicated onboarding',
                'SLA & custom contracts',
              ].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <Icon name="Check" size={15} className="shrink-0 text-emerald-500" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/contact"
              className="block rounded-full border border-slate-200 bg-white py-3 text-center font-semibold text-slate-700 transition-colors hover:border-slate-900"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ───────────────────────────────────────────────── */}
      <section className="bg-slate-900 py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-4 font-serif text-5xl leading-tight text-white">
            Ready to run your space{' '}
            <span className="serif-italic text-amber-300">the right way?</span>
          </h2>
          <p className="mb-8 text-lg text-white/60">
            Join the operators who've moved their entire booking workflow into AltSpaceCW.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/contact"
              className="rounded-full bg-amber-500 px-8 py-3.5 font-semibold text-white transition-colors hover:bg-amber-400"
            >
              Schedule a demo →
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-white/20 px-8 py-3.5 font-semibold text-white/80 transition-colors hover:border-white/40 hover:text-white"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-[#F6F4EF]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Logo />
                <div className="text-left leading-none">
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif text-xl text-slate-900">AltSpace</span>
                    <span className="rounded-md bg-amber-500 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-900 leading-none">CW</span>
                  </div>
                  <div className="text-[10px] italic text-slate-500">a place to do the work.</div>
                </div>
              </div>
            </div>
            <nav className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
              <Link to="/privacy" className="transition-colors hover:text-slate-900">Privacy Policy</Link>
              <Link to="/contact" className="transition-colors hover:text-slate-900">Contact Us</Link>
              <Link to="/login"   className="transition-colors hover:text-slate-900">Login</Link>
            </nav>
          </div>
          <div className="mt-8 border-t border-slate-200 pt-6 text-sm text-slate-400">
            © 2025 HNSCorpPH. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  )
}
