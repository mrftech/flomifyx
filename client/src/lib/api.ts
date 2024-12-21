import { supabase } from './supabase';

export interface Item {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

export async function getItems(page = 0, limit = 12) {
  try {
    console.log('Fetching items from Supabase...');
    const offset = page * limit;
    
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching items:', error);
      throw error;
    }

    console.log('Successfully fetched items:', data);
    return data as Item[];
  } catch (error) {
    console.error('Failed to fetch items:', error);
    throw error;
  }
} 