// vitest.config.ts
import { defineConfig } from 'vitest/config'
import swc from 'unplugin-swc'

export default defineConfig(async () => {
  // importa dinamicamente o tsconfig-paths, já que é ESM-only
  const tsconfigPaths = (await import('vite-tsconfig-paths')).default

  return {
    plugins: [
      tsconfigPaths(),
      // se você quiser usar o swc igual no e2e, descomente:
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
  }
})