import { useQuery, useMutation, useQueryClient } from 'react-query';
import { supabase, Item, handleSupabaseError } from '../lib/supabase';

export interface ItemDetail extends Item {
  platforms: {
    platform_id: string;
    version: string;
    compatibility_notes: string;
  }[];
  tags: string[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
  license: {
    id: string;
    name: string;
    terms_url: string;
  };
}

export const useItemDetail = (itemId: string) => {
  return useQuery<ItemDetail, Error>(
    ['item', itemId],
    async () => {
      // Fetch item with related data in a single query
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          platforms:item_platforms(platform_id, version, compatibility_notes),
          tags,
          category:categories(id, name, slug),
          license:licenses(id, name, terms_url)
        `)
        .eq('id', itemId)
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      return data;
    },
    {
      enabled: !!itemId,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      cacheTime: 30 * 60 * 1000, // Keep unused data in cache for 30 minutes
      retry: 2,
    }
  );
};

export const useUpdateItem = () => {
  const queryClient = useQueryClient();

  return useMutation<ItemDetail, Error, { id: string; updates: Partial<ItemDetail> }>(
    async ({ id, updates }) => {
      // First update the main item data
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .update({
          name: updates.name,
          description: updates.description,
          category_id: updates.category?.id,
          license_id: updates.license?.id,
          thumbnail_url: updates.thumbnail_url,
          live_preview: updates.live_preview,
          purchase_link: updates.purchase_link,
        })
        .eq('id', id)
        .select()
        .single();

      if (itemError) {
        handleSupabaseError(itemError);
      }

      // Update platforms if provided
      if (updates.platforms) {
        // Delete existing platforms
        await supabase
          .from('item_platforms')
          .delete()
          .eq('item_id', id);

        // Insert new platforms
        if (updates.platforms.length > 0) {
          const { error: platformError } = await supabase
            .from('item_platforms')
            .insert(
              updates.platforms.map(p => ({
                item_id: id,
                platform_id: p.platform_id,
                version: p.version,
                compatibility_notes: p.compatibility_notes,
              }))
            );

          if (platformError) {
            handleSupabaseError(platformError);
          }
        }
      }

      // Update tags if provided
      if (updates.tags) {
        const { error: tagError } = await supabase
          .from('items')
          .update({ tags: updates.tags })
          .eq('id', id);

        if (tagError) {
          handleSupabaseError(tagError);
        }
      }

      // Fetch the updated item with all relations
      const { data: updatedItem, error: fetchError } = await supabase
        .from('items')
        .select(`
          *,
          platforms:item_platforms(platform_id, version, compatibility_notes),
          tags,
          category:categories(id, name, slug),
          license:licenses(id, name, terms_url)
        `)
        .eq('id', id)
        .single();

      if (fetchError) {
        handleSupabaseError(fetchError);
      }

      return updatedItem;
    },
    {
      onSuccess: (data) => {
        queryClient.setQueryData(['item', data.id], data);
      },
    }
  );
};

export const useDeleteItem = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>(
    async (id) => {
      // Delete related platforms first
      const { error: platformError } = await supabase
        .from('item_platforms')
        .delete()
        .eq('item_id', id);

      if (platformError) {
        handleSupabaseError(platformError);
      }

      // Then delete the item
      const { error: itemError } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (itemError) {
        handleSupabaseError(itemError);
      }
    },
    {
      onSuccess: (_, id) => {
        // Remove from cache
        queryClient.removeQueries(['item', id]);
        // Invalidate items list
        queryClient.invalidateQueries('items');
      },
    }
  );
};

// Prefetch helper function
export const prefetchItemDetail = async (queryClient: any, itemId: string) => {
  await queryClient.prefetchQuery(
    ['item', itemId],
    async () => {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          platforms:item_platforms(platform_id, version, compatibility_notes),
          tags,
          category:categories(id, name, slug),
          license:licenses(id, name, terms_url)
        `)
        .eq('id', itemId)
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      return data;
    },
    {
      staleTime: 5 * 60 * 1000,
    }
  );
}; 