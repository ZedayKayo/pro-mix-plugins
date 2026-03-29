import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // This allows the local Vite dev server to handle the SPA History API routing
    // as well as any requests to /api that will be handled by Vercel when deployed.
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Mock target for local dev or use Vercel Dev
        changeOrigin: true,
      },
    },
  },
  // If you are using the Vercel CLI, we recommend running 'vercel dev'
  // instead of 'npm run dev' to automatically execute the serverless functions in /api.
});
