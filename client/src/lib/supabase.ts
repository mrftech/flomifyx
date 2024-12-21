import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

console.log('Initializing Supabase client with URL:', supabaseUrl);

try {
  export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'pixellibrary-web'
      }
    }
  });

  // Test the connection
  supabase.from('items').select('count', { count: 'exact', head: true })
    .then(({ error }) => {
      if (error) {
        console.error('Failed to connect to Supabase:', error);
      } else {
        console.log('Successfully connected to Supabase');
      }
    })
    .catch(error => {
      console.error('Error testing Supabase connection:', error);
    });
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  throw error;
} 