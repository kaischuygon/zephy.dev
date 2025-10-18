// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import react from '@astrojs/react';
import icon from 'astro-icon';

import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), mdx(), icon({include: {bx: ['*'], tabler: ['*']}})],
  vite: {
    plugins: [tailwindcss()]
  }
});
