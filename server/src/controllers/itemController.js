import { supabase } from '../config/supabase';

export const itemController = {
  async getItems(req, res) {
    const { itemType, pageSize = 10, lastId, keyword } = req.query;
    
    try {
      let query = supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(pageSize);

      if (itemType && itemType !== 'all') {
        query = query.eq('item_type', itemType);
      }

      if (lastId) {
        query = query.lt('id', lastId);
      }

      if (keyword) {
        query = query.or(`name.ilike.%${keyword}%,tags.cs.{${keyword}}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const lastIdValue = data.length === Number(pageSize) ? data[data.length - 1].id : null;

      res.json({
        items: data,
        lastId: lastIdValue
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async createItem(req, res) {
    const {
      name,
      description,
      itemType,
      categoryId,
      licenseType,
      thumbnailUrl,
      livePreview,
      purchaseLink,
      tags,
      platformData
    } = req.body;

    try {
      const { data, error } = await supabase
        .from('items')
        .insert([{
          name,
          description,
          item_type: itemType,
          category_id: categoryId,
          license_type: licenseType,
          thumbnail_url: thumbnailUrl,
          live_preview: livePreview,
          purchase_link: purchaseLink,
          tags,
          platform_data: platformData
        }])
        .select();

      if (error) throw error;

      res.status(201).json(data[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}; 