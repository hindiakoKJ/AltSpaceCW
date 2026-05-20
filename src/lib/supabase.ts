import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const isProd = import.meta.env.PROD

if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  if (isProd) throw new Error('VITE_SUPABASE_URL is not set. Check your Vercel environment variables.')
  else console.error('Missing VITE_SUPABASE_URL — check your .env.local file.')
}
if (!supabaseAnonKey || supabaseAnonKey.includes('placeholder')) {
  if (isProd) throw new Error('VITE_SUPABASE_ANON_KEY is not set. Check your Vercel environment variables.')
  else console.error('Missing VITE_SUPABASE_ANON_KEY — check your .env.local file.')
}

export const supabase = createClient<Database>(
  supabaseUrl     ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key'
)
