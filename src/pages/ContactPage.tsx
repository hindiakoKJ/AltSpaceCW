import { Link } from 'react-router-dom'
import { Wordmark } from '../components/layout/Wordmark'
import { Icon } from '../components/ui/Icon'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#F6F4EF]">
      {/* ─── Nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-[#F6F4EF]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/"><Wordmark height={40} /></Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link to="/#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Features</Link>
            <Link to="/#pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Pricing</Link>
            <Link to="/privacy" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Privacy</Link>
            <Link to="/contact" className="text-sm font-medium text-slate-900 transition-colors">Contact</Link>
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
      <section className="mx-auto max-w-3xl px-6 pb-16 pt-20 text-center">
        <div className="fade-up mb-4 text-sm font-semibold uppercase tracking-widest text-amber-500">
          Get in touch
        </div>
        <h1 className="fade-up font-serif text-6xl leading-tight text-slate-900" style={{ animationDelay: '0.05s' }}>
          We'd love to{' '}
          <span className="serif-italic">hear from you.</span>
        </h1>
        <p className="fade-up mx-auto mt-5 max-w-md text-lg leading-relaxed text-slate-500" style={{ animationDelay: '0.1s' }}>
          Whether you're a business looking to onboard your team or a member with questions, we're happy to help.
        </p>
      </section>

      {/* ─── Two columns ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">

          {/* Left — Contact form */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
            <h2 className="mb-6 font-serif text-2xl text-slate-900">Send us a message</h2>
            <form className="space-y-5" onSubmit={e => e.preventDefault()}>
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Juan dela Cruz"
                  className="w-full rounded-xl border border-slate-200 bg-[#F6F4EF] px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="juan@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-[#F6F4EF] px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>

              <div>
                <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  placeholder="Tell us how we can help..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-[#F6F4EF] px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-slate-900 py-3.5 font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                Send message
              </button>
            </form>
          </div>

          {/* Right — Contact info */}
          <div className="flex flex-col gap-5">
            {/* Info cards */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Icon name="MapPin" size={18} strokeWidth={1.75} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Our location</div>
                  <div className="mt-0.5 text-sm leading-relaxed text-slate-500">
                    Naga, Camarines Sur<br />
                    Philippines
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Icon name="Mail" size={18} strokeWidth={1.75} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Email us</div>
                  <a
                    href="mailto:hnscorpph@gmail.com"
                    className="mt-0.5 text-sm text-amber-600 hover:text-amber-500 transition-colors"
                  >
                    hnscorpph@gmail.com
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Icon name="Clock" size={18} strokeWidth={1.75} />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">Business hours</div>
                  <div className="mt-0.5 text-sm leading-relaxed text-slate-500">
                    Monday – Friday<br />
                    8:00 AM – 8:00 PM PHT
                  </div>
                </div>
              </div>
            </div>

            {/* Book a tour CTA card */}
            <div className="rounded-3xl bg-amber-500 p-8 shadow-soft-lg">
              <div className="mb-2 font-serif text-2xl text-white">Book a tour</div>
              <p className="mb-6 text-sm leading-relaxed text-amber-100">
                See the space in person before you commit. Tours are free and take about 20 minutes — we'll show you everything.
              </p>
              <Link
                to="/login"
                className="inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
              >
                Schedule a tour →
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
              <Wordmark height={36} />
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
