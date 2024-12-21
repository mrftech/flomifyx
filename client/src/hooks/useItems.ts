import { useQuery, useMutation, useQueryClient } from 'react-query';
import { supabase, Item, handleSupabaseError } from '../lib/supabase';

interface ItemFilters {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

const ITEMS_PER_PAGE = 10;

export const useItems = (filters: ItemFilters = {}) => {
  const {
    category,
    search,
    page = 1,
    limit = ITEMS_PER_PAGE
  } = filters;

  return useQuery<Item[], Error>(
    ['items', { category, search, page }],
    async () => {
      let query = supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (category) {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      // Apply pagination
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      query = query.range(start, end);

      const { data, error } = await query;

      if (error) {
        handleSupabaseError(error);
      }

      return data || [];
    },
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      cacheTime: 30 * 60 * 1000, // Keep unused data in cache for 30 minutes
      retry: 2,
    }
  );
};

export const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation<Item, Error, Partial<Item>>(
    async (newItem) => {
      const { data, error } = await supabase
        .from('items')
        .insert([newItem])
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      return data;
    },
    {
      // When mutate is called:
      onMutate: async (newItem) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries('items');

        // Snapshot the previous value
        const previousItems = queryClient.getQueryData<Item[]>(['items']);

        // Optimistically update to the new value
        if (previousItems) {
          queryClient.setQueryData<Item[]>(['items'], [
            { ...newItem, id: 'temp-id', created_at: new Date().toISOString() } as Item,
            ...previousItems,
          ]);
        }

        return { previousItems };
      },
      // If mutation fails, use the context returned from onMutate to roll back
      onError: (err, variables, context) => {
        if (context?.previousItems) {
          queryClient.setQueryData(['items'], context.previousItems);
        }
      },
      // Always refetch after error or success:
      onSettled: () => {
        queryClient.invalidateQueries('items');
      },
    }
  );
}; 