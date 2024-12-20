import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';

export default defineConfig(({ command, mode }) => {
  const config = {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  };

  if (command === 'build') {
    config.plugins.push(
      compression({
        algorithm: 'gzip',
        ext: '.gz'
      })
    );

    config.build = {
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            supabase: ['@supabase/supabase-js']
          }
        }
      }
    };
  }

  return config;
}); 