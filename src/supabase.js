import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.warn('[warp] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing — auth and library load will fail.')
}

export const supabase = createClient(url, key)
