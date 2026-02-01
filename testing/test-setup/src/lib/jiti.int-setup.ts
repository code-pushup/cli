import { beforeEach, vi } from 'vitest';

// Integration test setup - disable jiti caching to avoid stale module resolution
vi.mock('@code-pushup/utils', async () => {
  const utils =
    await vi.importActual<typeof import('@code-pushup/utils')>(
      '@code-pushup/utils',
    );

  return {
    ...utils,
    importModule: async (options: any) => {
      // Disable caching in integration tests
      return utils.importModule({
        ...options,
        fsCache: false,
        moduleCache: false,
      });
    },
  };
});

beforeEach(() => {
  // Clear any cached modules between tests
  vi.resetModules();
});
