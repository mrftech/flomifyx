export const security = {
  // Rate limiting for API calls
  rateLimiter: (() => {
    const cache = new Map();
    const LIMIT = 100; // requests
    const WINDOW = 60000; // 1 minute

    return {
      checkLimit: (key) => {
        const now = Date.now();
        const windowStart = now - WINDOW;
        
        // Clean old entries
        cache.forEach((value, k) => {
          if (value.timestamp < windowStart) cache.delete(k);
        });

        // Check current key
        const current = cache.get(key) || { count: 0, timestamp: now };
        if (current.timestamp < windowStart) {
          current.count = 1;
          current.timestamp = now;
        } else {
          current.count++;
        }
        cache.set(key, current);

        return current.count <= LIMIT;
      }
    };
  })(),

  // XSS prevention
  escapeHtml: (unsafe) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  // Content Security Policy
  getCspHeader: () => {
    return {
      'Content-Security-Policy': [
        "default-src 'self'",
        "img-src 'self' https:",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "connect-src 'self' https://supabase.flomify.com"
      ].join('; ')
    };
  }
}; 