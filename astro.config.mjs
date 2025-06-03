// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import react from '@astrojs/react';
import db from '@astrojs/db';
import markdoc from '@astrojs/markdoc';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), db(), markdoc(), icon({include: {bx: ['*']}})],
  vite: {
    plugins: [tailwindcss()]
  }
});