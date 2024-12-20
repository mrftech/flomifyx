// Sanitize and validate input data
export const sanitizer = {
  // Remove HTML tags and special characters
  cleanText: (text) => {
    if (!text) return '';
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/[<>'"]/g, '')
      .trim();
  },

  // Sanitize URL
  cleanUrl: (url) => {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' ? url : '';
    } catch {
      return '';
    }
  },

  // Sanitize tags array
  cleanTags: (tags) => {
    if (!Array.isArray(tags)) return [];
    return tags
      .filter(tag => typeof tag === 'string')
      .map(tag => tag.toLowerCase().trim())
      .filter(tag => tag.length > 0 && tag.length < 30)
      .slice(0, 10); // Limit number of tags
  },

  // Validate and clean platform data
  cleanPlatformData: (data) => {
    const allowedPlatforms = ['figma', 'framer', 'webflow'];
    const cleaned = {};

    allowedPlatforms.forEach(platform => {
      cleaned[platform] = {
        enabled: Boolean(data?.[platform]?.enabled),
        code: data?.[platform]?.enabled ? '...' : ''
      };
    });

    return cleaned;
  }
}; 