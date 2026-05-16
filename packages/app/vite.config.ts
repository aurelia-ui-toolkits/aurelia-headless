import { defineConfig } from 'vite';
// import aurelia from '@aurelia/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { transformAsync } from '@babel/core';
import decorators from '@babel/plugin-proposal-decorators';
import transformTypescript from '@babel/plugin-transform-typescript';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/aurelia-headless/' : '/',
  resolve: {
    alias: [
      { find: /^@aurelia-headless\/components$/, replacement: path.resolve(__dirname, '../components/src/index.ts') },
    ]
  },
  server: {
    open: true,
    port: 9000,
  },
  oxc: false,
  plugins: [
    {
      name: 'babel-standard-decorators',
      enforce: 'pre',
      async transform(code, id) {
        const [filename] = id.split('?');
        if (!filename.endsWith('.ts') || filename.endsWith('.d.ts') || filename.includes('/node_modules/')) {
          return null;
        }

        const result = await transformAsync(code, {
          filename,
          sourceMaps: true,
          plugins: [
            [decorators, { version: '2023-11' }],
            [transformTypescript, { allowDeclareFields: true }],
          ],
        });

        if (!result?.code) {
          return null;
        }

        const outputText = result.code.includes('Symbol.metadata')
          ? `Symbol.metadata ??= Symbol('Symbol.metadata');\n${result.code}`
          : result.code;

        return {
          code: outputText,
          map: result.map,
        };
      },
    },
    // aurelia({ useDev: true }),
    tailwindcss(),
  ]
});
