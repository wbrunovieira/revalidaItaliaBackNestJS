// vitest.config.e2e.ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig(async () => {
  // Faz o import dinâmico do plugin ESM-only
  const tsConfigPaths = (await import('vite-tsconfig-paths')).default;

  return {
    test: {
      include: ['test/e2e/**/*.e2e.spec.ts'],
      globals: true,
      environment: 'node',
      setupFiles: ['./test/setup-e2e.ts'],
      hookTimeout: 120_000,
      testTimeout: 120_000,
    },
    plugins: [
      // Aqui usamos o plugin já carregado
      tsConfigPaths(),
      swc.vite({
        module: { type: 'es6' },
      }),
    ],
  };
});