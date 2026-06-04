import { createClient } from '@supabase/supabase-js'

// Использует service role key — обходит RLS
// Только для серверных компонентов и API routes!
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
