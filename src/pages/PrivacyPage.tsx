import { Link } from 'react-router-dom'
import { Logo } from '../components/layout/Logo'

export default function PrivacyPage() {
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
            <Link to="/privacy" className="text-sm font-medium text-slate-900 transition-colors">Privacy</Link>
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
              className="hidden sm:inline-block rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-400 transition-colors"
            >
              Get a demo
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Content ─────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-20">
        <div className="fade-up mb-10 sm:mb-12">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-tight text-slate-900">Privacy Policy</h1>
          <p className="mt-4 text-sm text-slate-400">Last updated: October 20, 2026</p>
          <p className="mt-6 text-base leading-relaxed text-slate-600">
            AltSpaceCW is a booking platform for co-working spaces, operated by HNSCorpPH (Naga City, Camarines Sur, Philippines). This policy explains, in plain language, what personal information the platform handles, why, and the rights you have under the Data Privacy Act of 2012 (Republic Act No. 10173).
          </p>
          <p className="mt-4 text-base leading-relaxed text-slate-600">
            If you book through a co-working space that uses AltSpaceCW, that space decides how your booking information is used, and HNSCorpPH processes it on the space's behalf. For co-working operators who contact us or subscribe, HNSCorpPH is responsible for your information directly.
          </p>
        </div>

        <div className="space-y-12">
          {/* Section 1 */}
          <section>
            <h2 className="mb-4 font-serif text-3xl text-slate-900">1. Information we collect</h2>
            <div className="space-y-3 text-base leading-relaxed text-slate-600">
              <ul className="ml-5 list-disc space-y-2">
                <li><span className="font-medium text-slate-800">Account information</span> — your name, email address, the workspace you belong to, and your role. Your password is stored only in scrambled (hashed) form by our sign-in provider; nobody at HNSCorpPH can see it.</li>
                <li><span className="font-medium text-slate-800">Bookings</span> — the space, date, hours and amount of each booking, its payment status, and any membership plan credits your space assigns you.</li>
                <li><span className="font-medium text-slate-800">Contact form messages</span> — your name, email, business name and message.</li>
                <li><span className="font-medium text-slate-800">Error reports</span> — if the app crashes, technical details (browser, page and error) are sent to our error-monitoring service so we can fix it. We do not attach your name or email to these reports.</li>
              </ul>
              <p>
                We do not use advertising trackers or analytics cookies. Your browser keeps a sign-in token so you stay logged in; signing out removes it.
              </p>
              <p>
                We do not collect card or bank details. You pay your co-working space directly (for example in cash, by bank transfer or e-wallet); AltSpaceCW only records whether a booking has been paid and confirmed.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="mb-4 font-serif text-3xl text-slate-900">2. How we use it</h2>
            <div className="space-y-3 text-base leading-relaxed text-slate-600">
              <ul className="ml-5 list-disc space-y-2">
                <li>To take and manage your bookings and prevent double-booking.</li>
                <li>To email you when you book and when your payment is confirmed.</li>
                <li>To let your co-working space's administrators manage members, bookings and payments.</li>
                <li>To answer messages sent through our contact form.</li>
                <li>To keep the platform secure and fix errors.</li>
                <li>To meet legal obligations where required.</li>
              </ul>
              <p>We never sell your personal information and never use it for advertising.</p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="mb-4 font-serif text-3xl text-slate-900">3. Who can see it</h2>
            <div className="space-y-3 text-base leading-relaxed text-slate-600">
              <ul className="ml-5 list-disc space-y-2">
                <li>
                  <span className="font-medium text-slate-800">Your co-working space's administrators</span> — your name, email, bookings, payment status and plan credits. Each space can only see its own members; spaces cannot see each other's data.
                </li>
                <li>
                  <span className="font-medium text-slate-800">HNSCorpPH</span> — only when needed for support, security, or because the law requires it.
                </li>
                <li>
                  <span className="font-medium text-slate-800">Service providers we use to run the platform</span> — Supabase (database, sign-in and file storage), Vercel (website hosting), Resend (sending emails) and Sentry (error reports). Some of them store data on servers outside the Philippines. They may only use your information to provide their service to us.
                </li>
                <li>
                  <span className="font-medium text-slate-800">Authorities</span> — if we are legally required to disclose information by law, court order or a government authority.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="mb-4 font-serif text-3xl text-slate-900">4. How long we keep it</h2>
            <div className="space-y-3 text-base leading-relaxed text-slate-600">
              <ul className="ml-5 list-disc space-y-2">
                <li>Your account and booking history are kept while your account is active, so you and your co-working space have a record of your bookings.</li>
                <li>When you ask us to delete your account, we delete or anonymize your personal information within 30 days. Booking records your co-working space must keep for tax or accounting purposes are kept only for as long as the law requires.</li>
                <li>Contact form messages are kept only as long as we need them to answer you and follow up.</li>
                <li>Error reports are deleted automatically by our error-monitoring provider after its standard retention period.</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="mb-4 font-serif text-3xl text-slate-900">5. How we protect it</h2>
            <div className="space-y-3 text-base leading-relaxed text-slate-600">
              <p>
                All connections are encrypted (HTTPS). Each co-working space's data is separated at the database level, and what each person can see or change depends on their role. If a security incident affects your personal information, we will notify you and the National Privacy Commission as the law requires.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="mb-4 font-serif text-3xl text-slate-900">6. Your rights</h2>
            <div className="space-y-3 text-base leading-relaxed text-slate-600">
              <p>Under the Data Privacy Act you have the right to:</p>
              <ul className="ml-5 list-disc space-y-2">
                <li>be informed about how your information is used;</li>
                <li>access the information we hold about you;</li>
                <li>have inaccurate information corrected;</li>
                <li>object to processing, or have your information blocked or deleted;</li>
                <li>receive your information in a portable format (you can download your booking history as a CSV file from your dashboard, and we can export the rest on request);</li>
                <li>claim damages for unlawful processing, and file a complaint with the National Privacy Commission (privacy.gov.ph).</li>
              </ul>
              <p>
                To use any of these rights, email us at the address below. We will respond within 30 days. If you book through a co-working space, you may also contact the space directly.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="mb-4 font-serif text-3xl text-slate-900">7. Contact our Data Protection Officer</h2>
            <div className="space-y-3 text-base leading-relaxed text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
                <div className="text-sm font-semibold text-slate-900">Data Protection Officer — HNSCorpPH</div>
                <div className="mt-1 text-sm text-slate-500">Naga City, Camarines Sur, Philippines</div>
                <a
                  href="mailto:hnscorpph@gmail.com"
                  className="mt-1 inline-block text-sm text-amber-600 hover:text-amber-500 transition-colors"
                >
                  hnscorpph@gmail.com
                </a>
              </div>
              <p className="text-sm text-slate-400">
                We will post any changes to this policy on this page and email account holders about significant changes.
              </p>
            </div>
          </section>
        </div>
      </main>

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
