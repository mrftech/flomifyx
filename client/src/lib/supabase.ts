import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Type for common database entities
export interface Item {
  id: string;
  created_at: string;
  name: string;
  description: string;
  category_id: string;
  license_id: string;
  thumbnail_url?: string;
  live_preview?: string;
  purchase_link?: string;
  tags: string[];
  platform_data?: Record<string, any>;
}

// Utility function for error handling
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  throw new Error(error.message || 'An error occurred while fetching data');
}; 