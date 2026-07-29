import { createBrowserClient } from '@supabase/ssr'

// Create and export the initialized supabase instance
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Optional helper function
export function createClient() {
  return supabase
}