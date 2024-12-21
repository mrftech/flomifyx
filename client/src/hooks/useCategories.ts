import { useQuery, useMutation, useQueryClient } from 'react-query';
import { supabase, handleSupabaseError } from '../lib/supabase';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
}

export const useCategories = () => {
  return useQuery<Category[], Error>(
    'categories',
    async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

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

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<Category, Error, Partial<Category>>(
    async (newCategory) => {
      const { data, error } = await supabase
        .from('categories')
        .insert([newCategory])
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('categories');
      },
    }
  );
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<Category, Error, { id: string; updates: Partial<Category> }>(
    async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('categories');
      },
    }
  );
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>(
    async (id) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        handleSupabaseError(error);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('categories');
      },
    }
  );
}; 