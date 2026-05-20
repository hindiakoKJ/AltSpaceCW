import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { TenantProvider } from './context/TenantContext'
import { AppProvider } from './context/AppContext'
import { AppShell } from './components/layout/AppShell'
import LoginPage from './pages/LoginPage'
import ConsolePage from './pages/ConsolePage'
import LandingPage from './pages/LandingPage'
import PrivacyPage from './pages/PrivacyPage'
import ContactPage from './pages/ContactPage'
import type { ViewType } from './types/app'

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F4EF]">
      <div className="text-sm text-slate-400">Loading…</div>
    </div>
  )
}

function NoTenantAssigned() {
  const { signOut } = useAuth()
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F4EF] p-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <div className="font-serif text-xl text-slate-900">Account pending</div>
        <p className="mt-2 text-sm text-slate-500">
          Your account hasn't been assigned to a workspace yet. Contact your administrator.
        </p>
        <button
          onClick={() => signOut()}
          className="mt-6 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-stone-50"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

function RootRedirect() {
  const { session, profile, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/login" replace />

  if (profile.role === 'console') return <Navigate to="/console" replace />

  const slug = profile.tenant?.slug
  if (!slug) return <NoTenantAssigned />

  if (profile.role === 'admin') return <Navigate to={`/${slug}/admin`} replace />
  return <Navigate to={`/${slug}`} replace />
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const { slug } = useParams<{ slug?: string }>()
  if (loading) return <LoadingScreen />
  if (!session) return <Navigate to={slug ? `/login?workspace=${slug}` : '/login'} replace />
  return <>{children}</>
}

function RequireConsole({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (profile?.role !== 'console') return <Navigate to="/" replace />
  return <>{children}</>
}

/** Prevents a user from accessing a tenant that isn't theirs. */
function RequireTenant({ children }: { children: ReactNode }) {
  const { profile, loading, signOut } = useAuth()
  const { slug } = useParams<{ slug: string }>()
  if (loading) return <LoadingScreen />

  // Console admins can access any tenant
  if (profile?.role === 'console') return <>{children}</>

  // If the user's tenant slug doesn't match the URL slug, block access
  const userSlug = profile?.tenant?.slug
  if (userSlug && slug && userSlug !== slug) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F4EF] p-4">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div className="font-serif text-xl text-slate-900">Access denied</div>
          <p className="mt-2 text-sm text-slate-500">
            This workspace doesn&rsquo;t match your account. You belong to <strong>{userSlug}</strong>.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <a
              href={`/${userSlug}`}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              Go to my workspace
            </a>
            <button
              onClick={() => signOut()}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-stone-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

function TenantApp({ initialView }: { initialView: ViewType }) {
  return (
    <RequireAuth>
      <TenantProvider>
        <RequireTenant>
          <AppProvider initialView={initialView}>
            <AppShell />
          </AppProvider>
        </RequireTenant>
      </TenantProvider>
    </RequireAuth>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"             element={<LandingPage />} />
          <Route path="/privacy"      element={<PrivacyPage />} />
          <Route path="/contact"      element={<ContactPage />} />
          <Route path="/login"        element={<LoginPage />} />
          <Route path="/console"      element={<RequireAuth><RequireConsole><ConsolePage /></RequireConsole></RequireAuth>} />
          <Route path="/:slug/admin"  element={<TenantApp initialView="admin" />} />
          <Route path="/:slug"        element={<TenantApp initialView="book"  />} />
          <Route path="*"             element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
