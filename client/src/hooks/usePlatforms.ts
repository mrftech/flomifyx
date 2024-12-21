import { useQuery } from 'react-query';
import { supabase, handleSupabaseError } from '../lib/supabase';

export interface Platform {
  id: string;
  name: string;
  slug: string;
  icon_url?: string;
  website_url?: string;
  created_at: string;
}

export interface PlatformData {
  platform_id: string;
  version?: string;
  compatibility_notes?: string;
}

export const usePlatforms = () => {
  return useQuery<Platform[], Error>(
    'platforms',
    async () => {
      const { data, error } = await supabase
        .from('platforms')
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

export const useItemPlatforms = (itemId: string) => {
  return useQuery<PlatformData[], Error>(
    ['itemPlatforms', itemId],
    async () => {
      const { data, error } = await supabase
        .from('item_platforms')
        .select(`
          platform_id,
          version,
          compatibility_notes
        `)
        .eq('item_id', itemId);

      if (error) {
        handleSupabaseError(error);
      }

      return data || [];
    },
    {
      enabled: !!itemId,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      cacheTime: 30 * 60 * 1000, // Keep unused data in cache for 30 minutes
    }
  );
}; 