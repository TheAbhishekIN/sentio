import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    fileParallelism: false,
    pool: 'forks',
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: [
        'lib/**/*.ts',
        'app/api/**/*.ts',
        'hooks/**/*.ts',
        'components/checkin/**/*.tsx',
      ],
      exclude: ['lib/types.ts', 'lib/constants.ts'],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
