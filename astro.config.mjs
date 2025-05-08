// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import react from '@astrojs/react';
import db from '@astrojs/db';
import markdoc from '@astrojs/markdoc';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), db(), markdoc()],
  vite: {
    plugins: [tailwindcss()]
  }
});