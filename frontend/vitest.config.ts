import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)'],
      slowTestThreshold: 1000,
      maxConcurrency: 5,
    },
  }),
)
