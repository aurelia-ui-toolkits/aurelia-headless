import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(viteConfig, defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  test: {
    environment: 'jsdom',
    include: ['test/**/*.spec.ts'],
    setupFiles: ['test/setup.ts'],
    environmentOptions: { jsdom: { pretendToBeVisual: true } },
  },
}));
