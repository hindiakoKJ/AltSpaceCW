import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any

export interface Profile {
  id:         string
  full_name:  string
  email:      string | null
  role:       'client' | 'admin' | 'console'
  plan:       string
  tenant_id:  string | null
  created_at: string
  tenant?: { id: string; name: string; slug: string; status: string } | null
}

interface AuthContextValue {
  session:  Session | null
  user:     User | null
  profile:  Profile | null
  loading:  boolean
  signIn:   (email: string, password: string) => Promise<{ error: Error | null; profile: Profile | null }>
  signUp:   (email: string, password: string, fullName: string, tenantSlug?: string) => Promise<{ error: Error | null }>
  signOut:  () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await sb
    .from('profiles')
    .select('*, tenant:tenants(id, name, slug, status)')
    .eq('id', userId)
    .single()
  if (error) console.error('[loadProfile]', error.message, 'userId:', userId)
  return (data as Profile | null)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user,    setUser]    = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          const p = await loadProfile(session.user.id)
          setProfile(p)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Keep session in sync (token refresh, sign-out from another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (!session) {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error as Error, profile: null }

    const p = await loadProfile(data.user.id)
    setSession(data.session)
    setUser(data.user)
    setProfile(p)
    setLoading(false)
    if (!p) {
      return { error: new Error('Profile not found. Contact your administrator.'), profile: null }
    }
    return { error: null, profile: p }
  }

  async function signUp(email: string, password: string, fullName: string, tenantSlug?: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          ...(tenantSlug ? { tenant_slug: tenantSlug } : {}),
        },
      },
    })
    return { error: error as Error | null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
