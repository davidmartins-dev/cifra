import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    fileParallelism: false,
    testTimeout: 60000,
    hookTimeout: 60000,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'super-secret-e2e-jwt-key-with-minimum-32-characters',
      JWT_EXPIRES_IN: '15m',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/cifra_test?schema=public',
    },
  },
});
