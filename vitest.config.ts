// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import swc from 'unplugin-swc';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
  esbuild: {
    target: 'esnext',
  },
  plugins: [
    // se você ainda quiser usar o SWC plugin:
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});