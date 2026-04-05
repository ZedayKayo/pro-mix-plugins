import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // When using plain `npm run dev` (no Vercel CLI), the /api proxy won't
    // have a real target — use `vercel dev` instead so serverless functions run.
    // `vercel dev` starts both Vite (port 3000) and the functions together.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // Don't crash the dev server if the API target isn't running
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.warn(
              '[Vite proxy] /api target unreachable — run `vercel dev` instead of `npm run dev` to use admin API functions locally.',
              err.code
            );
          });
        },
      },
    },
  },
});
