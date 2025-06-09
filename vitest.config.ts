// vitest.config.ts
import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import path from 'path';

export default defineConfig(async () => {
  // load the ESM-only tsconfig-paths plugin dynamically
  const tsconfigPaths = (await import('vite-tsconfig-paths')).default;

  return {
    resolve: {
      alias: [
        {
          find: '@nestjs/axios',
          replacement: path.resolve(__dirname, 'test-helpers/empty-module.ts'),
        },
      ],
    },
    plugins: [
      tsconfigPaths(),
      swc.vite({ module: { type: 'es6' } }),
    ],
    test: {
      globals: true,
      environment: 'node',
      include: ['src/**/*.spec.ts'],
      exclude: ['node_modules', 'dist'],
      hookTimeout: 120_000,
      testTimeout: 120_000,
    },
  };
});