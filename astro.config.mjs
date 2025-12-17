// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import react from '@astrojs/react';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://notomorrowbrewing.com',
  output: 'static',
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
  build: {
    // Cloudflare Pages compatible output
    format: 'directory',
  },
});