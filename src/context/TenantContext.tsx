import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import type { Tenant } from '../types/app'
import { supabase } from '../lib/supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any

interface TenantContextValue {
  tenant: Tenant | null
  loading: boolean
}

const TenantCtx = createContext<TenantContextValue>({ tenant: null, loading: true })

export function TenantProvider({ children }: { children: ReactNode }) {
  const { slug } = useParams<{ slug: string }>()
  const [tenant,  setTenant]  = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) { setLoading(false); return }

    sb.from('tenants')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data }: { data: Tenant | null }) => {
        setTenant(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  return <TenantCtx.Provider value={{ tenant, loading }}>{children}</TenantCtx.Provider>
}

export function useTenant() {
  return useContext(TenantCtx)
}
