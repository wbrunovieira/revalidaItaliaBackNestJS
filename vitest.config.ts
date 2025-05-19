import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@/': resolve(__dirname, './src/')  
    }
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: './test/setup.ts',
  }
});