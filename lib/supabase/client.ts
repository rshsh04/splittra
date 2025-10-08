
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createClient = (): SupabaseClient => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  return createSupabaseClient(supabaseUrl, supabaseKey)
}
