const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  error: (...args) => {
    if (isDevelopment) {
      console.error(...args);
    }
  }
}; 