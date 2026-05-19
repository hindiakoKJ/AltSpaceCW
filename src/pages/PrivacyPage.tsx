import { Link } from 'react-router-dom'
import { Wordmark } from '../components/layout/Wordmark'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F6F4EF]">
      {/* ─── Nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-[#F6F4EF]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/"><Wordmark height={40} /></Link>

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
              className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-400 transition-colors"
            >
              Get a demo
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Content ─────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-3xl px-6 py-20">
        <div className="fade-up mb-12">
          <h1 className="font-serif text-6xl leading-tight text-slate-900">Privacy Policy</h1>
          <p className="mt-4 text-sm text-slate-400">Last updated: May 2025</p>
          <p className="mt-6 text-base leading-relaxed text-slate-600">
            AltSpaceCW is operated by HNSCorpPH. We're committed to protecting your personal information and being transparent about what we collect and why. This policy explains our practices in plain language.
          </p>
        </div>

        <div className="space-y-12">
          {/* Section 1 */}
          <section>
            <h2 className="mb-4 font-serif text-3xl text-slate-900">1. Information We Collect</h2>
            <div className="space-y-3 text-base leading-relaxed text-slate-600">
              <p>
                We collect information you provide directly when you create an account or make a booking:
              </p>
              <ul className="ml-5 list-disc space-y-2 text-slate-600">
                <li><span className="font-medium text-slate-800">Account information</span> — your full name and email address when you register.</li>
                <li><span className="font-medium text-slate-800">Booking data</span> — the workspace, dates, times, and seat types you reserve.</li>
                <li><span className="font-medium text-slate-800">Usage data</span> — pages visited, features used, and session timestamps to help us improve the platform.</li>
                <li><span className="font-medium text-slate-800">Communications</span> — messages you send us through the contact form or support channels.</li>
              </ul>
              <p>
                We do not collect payment card details directly. Payments are processed by our third-party payment provider, which operates under its own privacy and security policies.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="mb-4 font-serif text-3xl text-slate-900">2. How We Use Your Information</h2>
            <div className="space-y-3 text-base leading-relaxed text-slate-600">
              <p>We use the information we collect to:</p>
              <ul className="ml-5 list-disc space-y-2">
                <li>Process and manage your workspace bookings.</li>
                <li>Send booking confirmations, reminders, and status updates.</li>
                <li>Respond to your support requests and inquiries.</li>
                <li>Identify and fix bugs, improve platform reliability, and develop new features.</li>
                <li>Comply with legal obligations where required.</li>
              </ul>
              <p>
                We will never use your information for advertising or sell access to your data to third-party marketers.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="mb-4 font-serif text-3xl text-slate-900">3. Data Sharing</h2>
            <div className="space-y-3 text-base leading-relaxed text-slate-600">
              <p>
                <span className="font-semibold text-slate-800">We do not sell your personal data.</span> We share your information only in the following limited circumstances:
              </p>
              <ul className="ml-5 list-disc space-y-2">
                <li>
                  <span className="font-medium text-slate-800">Workspace operators (tenants)</span> — the co-working space you book with receives your name, email, and booking details so they can manage your visit and confirm your reservation.
                </li>
                <li>
                  <span className="font-medium text-slate-800">Service providers</span> — trusted vendors who help us operate the platform (hosting, email delivery, payment processing). They are bound by confidentiality agreements and may only use your data to perform services on our behalf.
                </li>
                <li>
                  <span className="font-medium text-slate-800">Legal requirements</span> — if we are required to disclose information by law, court order, or government authority.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="mb-4 font-serif text-3xl text-slate-900">4. Data Retention</h2>
            <div className="space-y-3 text-base leading-relaxed text-slate-600">
              <p>We retain your data for as long as it is needed to provide the service and meet our legal obligations:</p>
              <ul className="ml-5 list-disc space-y-2">
                <li>
                  <span className="font-medium text-slate-800">Booking records</span> are kept for <span className="font-medium text-slate-800">2 years</span> from the booking date for accounting and dispute-resolution purposes.
                </li>
                <li>
                  <span className="font-medium text-slate-800">Account data</span> is retained until you request deletion of your account.
                </li>
                <li>
                  <span className="font-medium text-slate-800">Usage logs</span> are anonymized and aggregated after 90 days.
                </li>
              </ul>
              <p>
                After the applicable retention period, your data is securely deleted or anonymized so it can no longer be associated with you.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="mb-4 font-serif text-3xl text-slate-900">5. Your Rights</h2>
            <div className="space-y-3 text-base leading-relaxed text-slate-600">
              <p>You have the following rights regarding your personal data:</p>
              <ul className="ml-5 list-disc space-y-2">
                <li><span className="font-medium text-slate-800">Access</span> — request a copy of the data we hold about you.</li>
                <li><span className="font-medium text-slate-800">Correction</span> — ask us to correct inaccurate or incomplete information.</li>
                <li><span className="font-medium text-slate-800">Deletion</span> — request that we delete your account and associated personal data.</li>
                <li><span className="font-medium text-slate-800">Portability</span> — receive your data in a structured, machine-readable format.</li>
                <li><span className="font-medium text-slate-800">Objection</span> — object to certain uses of your data, including direct communications.</li>
              </ul>
              <p>
                To exercise any of these rights, please contact us at the email below. We will respond within 30 days.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="mb-4 font-serif text-3xl text-slate-900">6. Contact</h2>
            <div className="space-y-3 text-base leading-relaxed text-slate-600">
              <p>
                If you have questions, concerns, or requests related to this Privacy Policy or how we handle your data, please reach out to our privacy team:
              </p>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
                <div className="text-sm font-semibold text-slate-900">HNSCorpPH — Privacy Team</div>
                <a
                  href="mailto:hnscorpph@gmail.com"
                  className="mt-1 text-sm text-amber-600 hover:text-amber-500 transition-colors"
                >
                  hnscorpph@gmail.com
                </a>
              </div>
              <p className="text-sm text-slate-400">
                We take all privacy concerns seriously and aim to resolve them promptly.
              </p>
            </div>
          </section>
        </div>
      </main>

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
