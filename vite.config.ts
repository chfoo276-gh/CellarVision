import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env for libs that expect it or for fallback access
      'process.env': {
         API_KEY: env.VITE_API_KEY,
         VITE_GOOGLE_CLIENT_ID: env.VITE_GOOGLE_CLIENT_ID,
      }
    }
  };
});