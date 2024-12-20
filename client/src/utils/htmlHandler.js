export const htmlHandler = {
  // Prepare HTML for storage
  prepareForStorage(html) {
    try {
      // Remove unnecessary whitespace but preserve structure
      const cleaned = html
        .replace(/\s+/g, ' ')
        .replace(/> </g, '>\n<')
        .trim();

      // Create a safe JSON structure
      return {
        code: cleaned,
        version: 1,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error preparing HTML for storage:', error);
      return null;
    }
  },

  // Parse stored HTML
  parseFromStorage(stored) {
    try {
      if (typeof stored === 'string') {
        return stored; // Already a string
      }
      
      if (stored?.code) {
        return stored.code; // New format
      }

      return ''; // Invalid format
    } catch (error) {
      console.error('Error parsing stored HTML:', error);
      return '';
    }
  }
}; 