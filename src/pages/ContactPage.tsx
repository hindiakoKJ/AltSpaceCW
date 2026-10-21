import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/layout/Logo'
import { Icon } from '../components/ui/Icon'
import { supabase } from '../lib/supabase'

const INPUT = 'w-full rounded-xl border border-slate-200 bg-[#F6F4EF] px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'

export default function ContactPage() {
  const [openedAt] = useState(() => Date.now())
  const [form,    setForm]    = useState({ name: '', email: '', company: '', message: '', website: '' })
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.message.trim().length < 10) { setError('Please tell us a little more (at least 10 characters).'); return }
    setSending(true)
    const { data, error: fnError } = await supabase.functions.invoke('contact-message', {
      body: { ...form, elapsed_ms: Date.now() - openedAt },
    })
    setSending(false)
    if (fnError || (data as { error?: string } | null)?.error) {
      setError((data as { error?: string } | null)?.error ?? 'Your message could not be sent. Please email us at hnscorpph@gmail.com.')
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-[#F6F4EF]">
      {/* ─── Nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-[#F6F4EF]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <Logo />
            <div className="text-left leading-none">
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-xl text-slate-900">AltSpace</span>
                <span className="rounded-md bg-amber-500 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-900 leading-none">CW</span>
              </div>
              <div className="text-[10px] italic text-slate-500">a place to do the work.</div>
            </div>
          </Link>

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
            <a
              href="#message"
              className="hidden sm:inline-block rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-400 transition-colors"
            >
              Get a demo
            </a>
          </div>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 pb-10 pt-12 sm:pb-16 sm:pt-20 text-center">
        <div className="fade-up mb-4 text-sm font-semibold uppercase tracking-widest text-amber-500">
          Get in touch
        </div>
        <h1 className="fade-up font-serif text-4xl sm:text-5xl md:text-6xl leading-tight text-slate-900" style={{ animationDelay: '0.05s' }}>
          We'd love to{' '}
          <span className="serif-italic">hear from you.</span>
        </h1>
        <p className="fade-up mx-auto mt-5 max-w-md text-lg leading-relaxed text-slate-500" style={{ animationDelay: '0.1s' }}>
          Whether you're a business looking to onboard your team or a member with questions, we're happy to help.
        </p>
      </section>

      {/* ─── Two columns ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">

          {/* Left — Contact form */}
          <div id="message" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
            <h2 className="mb-6 font-serif text-2xl text-slate-900">Send us a message</h2>
            {sent ? (
              <div className="rounded-2xl bg-emerald-50 px-5 py-6 text-sm leading-relaxed text-emerald-800">
                <div className="mb-1 font-semibold">Thanks, {form.name.split(' ')[0] || 'there'} — message received.</div>
                We'll reply to {form.email} within one business day.
              </div>
            ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Hidden from people; bots fill it in */}
              <input type="text" name="website" value={form.website} onChange={set('website')}
                tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Full name
                </label>
                <input id="name" type="text" required maxLength={100} value={form.name} onChange={set('name')}
                  placeholder="Juan dela Cruz" className={INPUT} />
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <input id="email" type="email" required maxLength={200} value={form.email} onChange={set('email')}
                  placeholder="juan@example.com" className={INPUT} />
              </div>

              <div>
                <label htmlFor="company" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Co-working space name <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input id="company" type="text" maxLength={150} value={form.company} onChange={set('company')}
                  placeholder="e.g. Naga Hub Co-working" className={INPUT} />
              </div>

              <div>
                <label htmlFor="message-body" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Message
                </label>
                <textarea id="message-body" rows={5} required maxLength={4000} value={form.message} onChange={set('message')}
                  placeholder="How many desks and rooms do you have? What would you like to see in a demo?"
                  className={`${INPUT} resize-none`} />
              </div>

              {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>}

              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-full bg-slate-900 py-3.5 font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {sending ? 'Sending…' : 'Send message'}
              </button>
            </form>
            )}
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

            {/* Demo CTA card */}
            <div className="rounded-3xl bg-amber-500 p-8 shadow-soft-lg">
              <div className="mb-2 font-serif text-2xl text-white">Book a demo</div>
              <p className="mb-6 text-sm leading-relaxed text-amber-100">
                See your members' booking page and your admin dashboard in a free 20-minute walkthrough. Tell us a little about your space and we'll set a time.
              </p>
              <a
                href="#message"
                className="inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
              >
                Request a demo →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-[#F6F4EF]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-12">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
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
