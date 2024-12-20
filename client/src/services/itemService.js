import { sanitizer } from '../utils/sanitizer';
import { validator } from '../utils/validation';
import { security } from '../utils/security';
import { logger } from '../utils/logger';
import { supabase } from './supabaseClient';
import { htmlHandler } from '../utils/htmlHandler';

// Add this helper function at the top
const tryParseJSON = (str) => {
  if (!str) {
    return {
      figma: { code: '', enabled: false },
      framer: { code: '', enabled: false },
      webflow: { code: '', enabled: false }
    };
  }

  try {
    // First attempt: direct parse
    return JSON.parse(str);
  } catch (e1) {
    try {
      // Second attempt: try to extract code values directly
      const codeMatches = {
        figma: str.match(/figma":\s*{\s*"code":\s*"([^"]*)"/),
        framer: str.match(/framer":\s*{\s*"code":\s*"([^"]*)"/),
        webflow: str.match(/webflow":\s*{\s*"code":\s*"([^"]*)"/),
      };

      return {
        figma: {
          code: codeMatches.figma?.[1] || '',
          enabled: Boolean(codeMatches.figma?.[1])
        },
        framer: {
          code: codeMatches.framer?.[1] || '',
          enabled: Boolean(codeMatches.framer?.[1])
        },
        webflow: {
          code: codeMatches.webflow?.[1] || '',
          enabled: Boolean(codeMatches.webflow?.[1])
        }
      };
    } catch (e2) {
      console.error('JSON parse error:', e2);
      return {
        figma: { code: '', enabled: false },
        framer: { code: '', enabled: false },
        webflow: { code: '', enabled: false }
      };
    }
  }
};

// Update the sanitizeItem function
const sanitizeItem = (item) => {
  const platformData = tryParseJSON(item.platform_data);

  return {
    id: item.id,
    name: sanitizer.cleanText(item.name),
    description: sanitizer.cleanText(item.description),
    license_type: validator.licenseType(item.license_type) ? item.license_type : 'Free',
    thumbnail_url: sanitizer.cleanUrl(item.thumbnail_url),
    live_preview: sanitizer.cleanUrl(item.live_preview),
    tags: sanitizer.cleanTags(item.tags),
    platform_data: platformData
  };
};

export const itemService = {
  async getItems({ page = 1, pageSize = 12, search, sortBy, filters }) {
    try {
      // Build base queries
      const countQuery = supabase
        .from('items')
        .select('*', { count: 'exact', head: true });

      let query = supabase
        .from('items')
        .select('*');

      // Apply filters to both queries
      [countQuery, query].forEach(q => {
        // Item type filter
        if (filters?.itemType && filters.itemType !== 'all') {
          q.eq('item_type', filters.itemType);
        }

        // License type filter
        if (filters?.licenseType && filters.licenseType !== 'all') {
          q.eq('license_type', filters.licenseType);
        }

        // Category filter
        if (filters?.categoryId && filters.categoryId !== 'all') {
          q.eq('category_id', filters.categoryId);
        }

        // Collection filter
        if (filters?.collection && filters.collection !== 'all') {
          q.eq('collection', filters.collection);
        }

        // Platform filter - using available_platforms array
        if (filters?.platforms?.length > 0) {
          // Convert platforms array to PostgreSQL array syntax
          const platformArray = `{${filters.platforms.map(p => `"${p}"`).join(',')}}`;
          q.contains('available_platforms', platformArray);
        }

        // Tags filter
        if (filters?.tags?.length > 0) {
          q.contains('tags', filters.tags);
        }

        // Search filter
        if (search) {
          q.or(`name.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`);
        }
      });

      // Get total count
      const { count } = await countQuery;

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query.order('created_at', { ascending: true });
          break;
        case 'name-asc':
          query.order('name', { ascending: true });
          break;
        case 'name-desc':
          query.order('name', { ascending: false });
          break;
        case 'popularity':
          query.order('popularity_score', { ascending: false });
          break;
        default:
          query.order('created_at', { ascending: false });
      }

      // Apply pagination
      query.range(
        (page - 1) * pageSize,
        (page * pageSize) - 1
      );

      // Execute main query
      const { data: items, error } = await query;

      if (error) throw error;

      // Process items to ensure platform_data is properly handled
      const processedItems = items.map(item => {
        const sanitizedItem = sanitizeItem(item);
        
        // Ensure available_platforms is always an array
        sanitizedItem.available_platforms = Array.isArray(item.available_platforms) 
          ? item.available_platforms 
          : [];

        // Update platform_data based on available_platforms
        const platformData = tryParseJSON(item.platform_data);
        Object.keys(platformData).forEach(platform => {
          platformData[platform].enabled = sanitizedItem.available_platforms.includes(platform);
        });
        sanitizedItem.platform_data = platformData;

        return sanitizedItem;
      });

      return {
        items: processedItems,
        totalCount: count,
        hasMore: count > (page * pageSize),
        currentPage: page,
        filterOptions: page === 1 ? await this.getFilterOptions() : null
      };
    } catch (error) {
      console.error('Error fetching items:', error);
      throw error;
    }
  },

  async copyPlatformCode(itemId, platform) {
    // Get item details including license type first
    const { data: item, error } = await supabase
      .from('items')
      .select('platform_data, license_type')
      .eq('id', itemId)
      .single();

    if (error) throw error;

    // Check if it's a premium item
    if (item.license_type === 'Premium') {
      // Only check user and subscription for premium items
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to copy premium items');
      }

      // Check subscription for premium items
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, expires_at')
        .eq('user_id', user.id)
        .single();

      if (!subscription || 
          subscription.status !== 'active' || 
          new Date(subscription.expires_at) < new Date()) {
        throw new Error('This is a premium item. Please upgrade your subscription to copy premium code.');
      }
    }

    // Continue with copying if item is free or premium checks pass
    const platformData = JSON.parse(item.platform_data);
    const decodedCode = atob(platformData[platform].code);

    console.log('Attempting to copy code:', decodedCode);

    try {
      // Create a temporary textarea
      const textarea = document.createElement('textarea');
      textarea.style.cssText = 'position: fixed; top: -9999px; left: -9999px; opacity: 0;';
      
      // Set content type and value
      textarea.contentEditable = true;
      textarea.setAttribute('contenteditable', true);
      textarea.setAttribute('type', 'text/html');
      textarea.innerHTML = decodedCode;
      
      document.body.appendChild(textarea);

      // Focus and select the content
      textarea.focus();
      textarea.select();

      // Add copy event listener
      const listener = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Only set HTML data
        e.clipboardData.setData('text/html', decodedCode);
        console.log('Copy event triggered, HTML data set');
      };

      // Add listener and execute copy
      document.addEventListener('copy', listener, { once: true });
      const copyResult = document.execCommand('copy');
      console.log('Copy command result:', copyResult);

      // Cleanup
      document.body.removeChild(textarea);
      
      return decodedCode;
    } catch (e) {
      console.error('Copy failed:', e);
      throw new Error('Failed to copy code');
    }
  },

  async createItem(itemData) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Authentication required');
    }

    // Add debug log
    console.log('Creating item with code:', {
      figma: itemData.figmaCode,
      framer: itemData.framerCode,
      webflow: itemData.webflowCode
    });

    const platformData = JSON.stringify({
      [platform]: {
        code: btoa(htmlCode), // HTML is base64 encoded before storage
        enabled: true
      }
    });

    // Add debug log
    console.log('Platform data being stored:', platformData);

    const timestamp = new Date().toISOString();
    const { data, error } = await supabase
      .from('items')
      .insert([{
        ...itemData,
        item_id: `itemId-${Date.now()}`,
        user_id: user.id,
        platform_data: platformData,
        created_at: timestamp,
        updated_at: timestamp
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  async getItemById(id) {
    try {
      console.log('Fetching item:', id);
      const { data: item, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      console.log('Retrieved item:', item);
      
      if (!item) throw new Error('Item not found');
      
      return item;
    } catch (error) {
      console.error('Error in getItemById:', error);
      throw error;
    }
  },

  async getRelatedItems(itemId, tags) {
    try {
      console.log('Fetching related items with tags:', tags);
      
      // Use overlaps to find items that share any of the tags
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .neq('id', itemId)  // Exclude current item
        .overlaps('tags', tags)  // Changed from contains to overlaps
        .order('created_at', { ascending: false })  // Add ordering
        .limit(8);

      if (error) throw error;
      
      console.log('Found related items:', data?.length || 0);
      console.log('Related items:', data);
      
      return data || [];
    } catch (error) {
      console.error('Error fetching related items:', error);
      throw error;
    }
  },

  async getCollectionItems(itemId, collection, limit = 8) {
    try {
      console.log('Fetching collection items for:', collection);
      
      // First, get total count of items in collection
      const { count } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('collection', collection)
        .neq('id', itemId);

      // Then fetch the items with proper ordering
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('collection', collection)
        .neq('id', itemId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      console.log('Found collection items:', data?.length || 0);
      console.log('Total collection items:', count);
      
      return {
        items: data || [],
        totalCount: count,
        hasMore: count > (data?.length || 0)
      };
    } catch (error) {
      console.error('Error fetching collection items:', error);
      throw error;
    }
  },

  async getFilterOptions() {
    try {
      const { data: items } = await supabase
        .from('items')
        .select('item_type, license_type, category_id, collection, tags, platform_data');

      // Extract unique values
      const options = {
        itemTypes: [...new Set(items.map(item => item.item_type))].filter(Boolean),
        licenseTypes: [...new Set(items.map(item => item.license_type))].filter(Boolean),
        categories: [...new Set(items.map(item => item.category_id))].filter(Boolean),
        collections: [...new Set(items.map(item => item.collection))].filter(Boolean),
        tags: [...new Set(items.flatMap(item => item.tags || []))].filter(Boolean),
        platforms: ['figma', 'framer', 'webflow'] // Static list of supported platforms
      };

      return options;
    } catch (error) {
      console.error('Error fetching filter options:', error);
      throw error;
    }
  }
}; 