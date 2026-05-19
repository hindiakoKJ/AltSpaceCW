import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { TenantProvider } from './context/TenantContext'
import { AppProvider } from './context/AppContext'
import { AppShell } from './components/layout/AppShell'
import LoginPage from './pages/LoginPage'
import ConsolePage from './pages/ConsolePage'
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

function TenantApp({ initialView }: { initialView: ViewType }) {
  return (
    <RequireAuth>
      <TenantProvider>
        <AppProvider initialView={initialView}>
          <AppShell />
        </AppProvider>
      </TenantProvider>
    </RequireAuth>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
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
