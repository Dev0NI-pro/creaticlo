// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  devToolbar: {
    enabled: false
  },
  output: 'server',
  adapter: netlify(),
  site: 'https://creaticlo.netlify.app',
  integrations: [icon()],
  vite: {
    plugins: [tailwindcss()]
  },
});