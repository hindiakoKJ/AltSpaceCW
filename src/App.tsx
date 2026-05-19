import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import { AppShell } from './components/layout/AppShell'
import LoginPage from './pages/LoginPage'

function AppInner() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F4EF]">
        <div className="text-sm text-slate-400">Loading…</div>
      </div>
    )
  }

  if (!session) return <LoginPage />

  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
