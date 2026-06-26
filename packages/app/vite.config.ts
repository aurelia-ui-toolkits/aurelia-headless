import { defineConfig } from 'vite';
import aurelia from '@aurelia/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import babel from '@rolldown/plugin-babel';

const aureliaResourceInclude = [
  path.posix.join(path.resolve(__dirname, 'src').replaceAll('\\', '/'), '**/*.{ts,js,html}'),
  path.posix.join(path.resolve(__dirname, '../components/src').replaceAll('\\', '/'), '**/*.{ts,js,html}'),
];

function decoratorPreset(options: Record<string, unknown>) {
  return {
    preset: () => ({
      plugins: [['@babel/plugin-proposal-decorators', options]],
    }),
    rolldown: {
      filter: {
        code: '@',
      },
    },
  };
}

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/aurelia-headless/' : '/',
  resolve: {
    alias: [
      { find: /^@aurelia-ui-toolkits\/headless$/, replacement: path.resolve(__dirname, '../components/src/index.ts') },
    ]
  },
  server: {
    open: true,
    port: 9000,
  },
  plugins: [
    aurelia({ useDev: true, include: aureliaResourceInclude }),
    babel({ presets: [decoratorPreset({ version: '2023-11' })] }),
    tailwindcss(),
  ]
});
