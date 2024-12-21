import { useQuery } from 'react-query';
import { supabase, handleSupabaseError } from '../lib/supabase';

export interface License {
  id: string;
  name: string;
  description: string;
  terms_url?: string;
  created_at: string;
}

export const useLicenses = () => {
  return useQuery<License[], Error>(
    'licenses',
    async () => {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .order('name');

      if (error) {
        handleSupabaseError(error);
      }

      return data || [];
    },
    {
      staleTime: 60 * 60 * 1000, // Consider data fresh for 1 hour
      cacheTime: 24 * 60 * 60 * 1000, // Keep unused data in cache for 24 hours
    }
  );
}; 