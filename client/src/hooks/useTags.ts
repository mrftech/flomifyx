import { useQuery, useMutation, useQueryClient } from 'react-query';
import { supabase, handleSupabaseError } from '../lib/supabase';

export interface Tag {
  id: string;
  name: string;
  slug: string;
  count: number;
  created_at: string;
}

export const useTags = (limit?: number) => {
  return useQuery<Tag[], Error>(
    ['tags', { limit }],
    async () => {
      let query = supabase
        .from('tags')
        .select('*')
        .order('count', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        handleSupabaseError(error);
      }

      return data || [];
    },
    {
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      cacheTime: 30 * 60 * 1000, // Keep unused data in cache for 30 minutes
    }
  );
};

export const useTagSearch = (searchTerm: string) => {
  return useQuery<Tag[], Error>(
    ['tags', 'search', searchTerm],
    async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .ilike('name', `%${searchTerm}%`)
        .order('count', { ascending: false })
        .limit(10);

      if (error) {
        handleSupabaseError(error);
      }

      return data || [];
    },
    {
      enabled: searchTerm.length > 0,
      staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
      cacheTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes
    }
  );
};

export const useCreateTag = () => {
  const queryClient = useQueryClient();

  return useMutation<Tag, Error, { name: string }>(
    async ({ name }) => {
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      
      const { data, error } = await supabase
        .from('tags')
        .insert([{ name, slug, count: 1 }])
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tags');
      },
    }
  );
}; 