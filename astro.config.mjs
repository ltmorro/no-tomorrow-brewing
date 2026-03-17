// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import react from '@astrojs/react';
import icon from 'astro-icon';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://notomorrowbrewing.com',
  adapter: cloudflare(),
  integrations: [
    tailwind(),
    react(),
    icon({
      include: {
        // Include any iconify icon sets you want to use
        // mdi: ['*'], // Example: Material Design Icons
      },
    }),
  ],
  vite: {
    ssr: {
      resolve: {
        conditions: ['workerd', 'worker', 'browser'],
      },
    },
  },
});