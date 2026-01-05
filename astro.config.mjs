// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import react from '@astrojs/react';
import icon from 'astro-icon';
import pagefind from "astro-pagefind";

import mdx from '@astrojs/mdx';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), mdx(), icon({include: {lineicons: ['*'], "fa7-brands": ['*']}}), pagefind()],

  vite: {
    plugins: [tailwindcss()]
  },

  site: "https://zephy.dev",
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
    imagesConfig: {
      sizes: [250, 320, 640, 1280],
      domains: []
    }
  })
});
