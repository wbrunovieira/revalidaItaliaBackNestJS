// vitest.config.e2e.ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig(async () => {
  const tsConfigPaths = (await import('vite-tsconfig-paths')).default;

  return {
    test: {
      include: ['test/e2e/**/*.e2e.spec.ts'],
      globals: true,
      environment: 'node',
      setupFiles: ['./test/setup-e2e.ts'],
      hookTimeout: 120_000,
      testTimeout: 120_000,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        reportsDirectory: './coverage-e2e',
        include: ['src/**/*.ts'],
        exclude: [
          '**/*.spec.ts',
          '**/*.e2e.spec.ts',
          'src/test/**',
          'src/**/*.module.ts',
          'src/main.ts',
          'src/seed.ts',
          '**/*.d.ts',
          'src/infra/env/**',
        ],
      },
    },
    plugins: [
      tsConfigPaths(),
      swc.vite({
        module: { type: 'es6' },
      }),
    ],
  };
});
