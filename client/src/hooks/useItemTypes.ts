import { useQuery } from 'react-query';
import { supabase, handleSupabaseError } from '../lib/supabase';

export interface ItemType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
}

export const useItemTypes = () => {
  return useQuery<ItemType[], Error>(
    'itemTypes',
    async () => {
      const { data, error } = await supabase
        .from('item_types')
        .select('*')
        .order('name');

      if (error) {
        handleSupabaseError(error);
      }

      return data || [];
    },
    {
      staleTime: 30 * 60 * 1000, // Consider data fresh for 30 minutes
      cacheTime: 60 * 60 * 1000, // Keep unused data in cache for 1 hour
    }
  );
}; 