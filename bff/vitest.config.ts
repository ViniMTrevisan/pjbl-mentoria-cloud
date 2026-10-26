import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // `globals: true` é exigido pelo ArchUnitTS para estender o `expect` com `toPassAsync()`.
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    reporters: 'default',
  },
});
