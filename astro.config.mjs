import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import node from '@astrojs/node';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';

// Static public site; the Keystatic admin route renders on demand via the Node adapter.
export default defineConfig({
  site: 'https://growuphackathon.pl',
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [icon(), react(), keystatic(), sitemap()],
  vite: {
    optimizeDeps: {
      // react-dom/client is CJS; force pre-bundling so Vite exposes named ESM exports
      // (e.g. createRoot) that Keystatic's island hydration relies on.
      include: ['react-dom/client'],
    },
  },
});
