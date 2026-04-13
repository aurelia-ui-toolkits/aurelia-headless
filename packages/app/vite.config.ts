import { defineConfig } from 'vite';
import aurelia from '@aurelia/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@aurelia-headless\/components$/, replacement: path.resolve(__dirname, '../components/src') },
    ]
  },
  server: {
    open: true,
    port: 9000,
  },
  plugins: [
    aurelia({ useDev: true }),
    tailwindcss(),
  ]
});
