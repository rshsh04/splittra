
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

export const createClient = (): SupabaseClient => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  // Return existing instance if it exists
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Create new instance and cache it
  supabaseInstance = createSupabaseClient(supabaseUrl, supabaseKey);
  return supabaseInstance;
}
