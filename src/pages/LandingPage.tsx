import { Link } from 'react-router-dom'
import { Logo } from '../components/layout/Logo'
import { Icon } from '../components/ui/Icon'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F6F4EF]">
      {/* ─── Nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-[#F6F4EF]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="font-serif text-xl text-slate-900">AltSpaceCW</span>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
            <Link to="/privacy" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Privacy</Link>
            <Link to="/contact" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300 transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/login"
              className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-400 transition-colors"
            >
              Get a demo
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 pb-24 pt-24 text-center">
        <div className="fade-up mb-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-soft">
          <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Studio open · BGC, Manila
        </div>

        <h1 className="fade-up mb-6 text-[72px] font-serif leading-[1.05] tracking-tight text-slate-900" style={{ animationDelay: '0.05s' }}>
          The workspace that{' '}
          <span className="serif-italic text-slate-700">works for you.</span>
        </h1>

        <p className="fade-up mx-auto mb-10 max-w-xl text-lg leading-relaxed text-slate-500" style={{ animationDelay: '0.1s' }}>
          Flexible hot desks, dedicated seats, and meeting rooms in the heart of BGC — book by the hour or lock in a monthly spot with zero long-term commitment.
        </p>

        <div className="fade-up flex flex-wrap items-center justify-center gap-4" style={{ animationDelay: '0.15s' }}>
          <Link
            to="/login"
            className="rounded-full bg-slate-900 px-7 py-3.5 font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Book a desk →
          </Link>
          <a
            href="#how-it-works"
            className="rounded-full border border-slate-200 bg-white px-7 py-3.5 font-semibold text-slate-700 hover:border-slate-300 transition-colors"
          >
            See how it works
          </a>
        </div>

        {/* Social proof */}
        <div className="fade-up mt-10 flex items-center justify-center gap-3" style={{ animationDelay: '0.2s' }}>
          <div className="flex -space-x-2">
            {['#CBD5E1', '#94A3B8', '#64748B', '#475569', '#334155'].map((color, i) => (
              <div
                key={i}
                className="h-8 w-8 rounded-full border-2 border-white ring-1 ring-slate-200"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <span className="text-sm text-slate-500">
            Trusted by <span className="font-semibold text-slate-700">200+ professionals</span>
          </span>
        </div>
      </section>

      {/* ─── Features strip ──────────────────────────────────────────── */}
      <section id="features" className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-slate-200 px-6 md:grid-cols-3 md:divide-x md:divide-y-0">
          {[
            {
              icon: 'CalendarDays',
              title: 'Book in seconds',
              body: 'Real-time seat availability at your fingertips. Pick a date, choose your desk, confirm — done in under a minute.',
            },
            {
              icon: 'Banknote',
              title: 'Pay as you go',
              body: 'No long-term contracts or hidden fees. Pay only for the time you actually use — hourly, daily, or monthly.',
            },
            {
              icon: 'ShieldCheck',
              title: 'Admin control',
              body: 'Operators get a full dashboard to manage bookings, members, and capacity with total visibility.',
            },
          ].map(({ icon, title, body }) => (
            <div key={title} className="flex gap-5 px-8 py-10">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                <Icon name={icon} size={22} strokeWidth={1.75} />
              </div>
              <div>
                <div className="mb-1.5 font-semibold text-slate-900">{title}</div>
                <p className="text-sm leading-relaxed text-slate-500">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it works ────────────────────────────────────────────── */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 text-center">
          <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-500">How it works</div>
          <h2 className="font-serif text-5xl text-slate-900">Four steps to your desk.</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[
            {
              step: '01',
              title: 'Choose your workspace + dates',
              body: 'Browse available hot desks, dedicated seats, or meeting rooms. Pick the dates and times that work for your schedule.',
              icon: 'MapPin',
            },
            {
              step: '02',
              title: 'Reserve your seat — 30 min to pay',
              body: "Your chosen seat is held for 30 minutes while you complete payment. No stress, no pressure to rush.",
              icon: 'Clock',
            },
            {
              step: '03',
              title: "Admin confirms → you're in",
              body: 'Once payment is verified, the workspace admin confirms your booking and you receive an instant notification.',
              icon: 'CheckCircle',
            },
            {
              step: '04',
              title: 'Walk in and work',
              body: 'Show up, settle in, and get things done. Great coffee, fast Wi-Fi, and a community of focused professionals awaits.',
              icon: 'Laptop',
            },
          ].map(({ step, title, body, icon }) => (
            <div key={step} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
              <div className="mb-5 flex items-start justify-between">
                <span className="font-serif text-5xl leading-none text-slate-100">{step}</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Icon name={icon} size={18} strokeWidth={2} />
                </div>
              </div>
              <h3 className="mb-2 font-semibold text-slate-900">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Pricing teaser ──────────────────────────────────────────── */}
      <section id="pricing" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <div className="mb-3 text-sm font-semibold uppercase tracking-widest text-amber-500">Pricing</div>
            <h2 className="font-serif text-5xl text-slate-900">Simple, transparent rates.</h2>
            <p className="mx-auto mt-4 max-w-md text-slate-500">
              No setup fees, no membership dues. Just pay for what you use.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Hot Desk */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
              <div className="mb-1 text-sm font-semibold uppercase tracking-widest text-slate-400">Hot Desk</div>
              <div className="mb-1 font-serif text-4xl text-slate-900">₱250</div>
              <div className="mb-6 text-sm text-slate-400">per hour · or ₱1,200 / day</div>
              <ul className="mb-8 space-y-3 text-sm text-slate-600">
                {['Open seating area', 'High-speed Wi-Fi', 'Complimentary coffee', 'Locker access'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <Icon name="Check" size={15} className="shrink-0 text-emerald-500" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className="block rounded-full border border-slate-200 bg-white py-3 text-center font-semibold text-slate-700 hover:border-slate-300 transition-colors"
              >
                Get started
              </Link>
            </div>

            {/* Dedicated Desk — popular */}
            <div className="relative rounded-3xl border-2 border-amber-400 bg-white p-8 shadow-soft-lg">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-amber-500 px-4 py-1 text-xs font-semibold text-white">
                  Most popular
                </span>
              </div>
              <div className="mb-1 text-sm font-semibold uppercase tracking-widest text-amber-500">Dedicated Desk</div>
              <div className="mb-1 font-serif text-4xl text-slate-900">₱8,500</div>
              <div className="mb-6 text-sm text-slate-400">per month</div>
              <ul className="mb-8 space-y-3 text-sm text-slate-600">
                {['Your own assigned desk', 'Dedicated storage', 'Priority booking for rooms', '24/5 access'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <Icon name="Check" size={15} className="shrink-0 text-emerald-500" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className="block rounded-full bg-slate-900 py-3 text-center font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                Get started
              </Link>
            </div>

            {/* Meeting Room */}
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
              <div className="mb-1 text-sm font-semibold uppercase tracking-widest text-slate-400">Meeting Room</div>
              <div className="mb-1 font-serif text-4xl text-slate-900">₱800</div>
              <div className="mb-6 text-sm text-slate-400">per hour</div>
              <ul className="mb-8 space-y-3 text-sm text-slate-600">
                {['Seats up to 8 people', '4K display & whiteboard', 'Video conferencing setup', 'Catering available'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <Icon name="Check" size={15} className="shrink-0 text-emerald-500" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className="block rounded-full border border-slate-200 bg-white py-3 text-center font-semibold text-slate-700 hover:border-slate-300 transition-colors"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-[#F6F4EF]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Logo />
                <span className="font-serif text-xl text-slate-900">AltSpaceCW</span>
              </div>
              <p className="text-sm text-slate-400">Where great work happens</p>
            </div>

            <nav className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
              <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
              <Link to="/contact" className="hover:text-slate-900 transition-colors">Contact Us</Link>
              <Link to="/login" className="hover:text-slate-900 transition-colors">Login</Link>
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
