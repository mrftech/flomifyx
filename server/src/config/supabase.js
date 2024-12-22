import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  headers: {
    'apikey': supabaseKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Prefer': 'return=minimal'
  }
}); 