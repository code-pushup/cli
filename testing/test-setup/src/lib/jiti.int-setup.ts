import { beforeEach, vi } from 'vitest';
import type { ImportModuleOptions } from '@code-pushup/utils';

// Integration test setup - disable jiti caching to avoid stale module resolution
vi.mock('@code-pushup/utils', async () => {
  const utils =
    await vi.importActual<typeof import('@code-pushup/utils')>(
      '@code-pushup/utils',
    );

  return {
    ...utils,
    importModule: async (options: ImportModuleOptions) =>
      // Disable caching in integration tests
      utils.importModule({
        ...options,
        fsCache: false,
        moduleCache: false,
      }),
  };
});

beforeEach(() => {
  // Clear any cached modules between tests
  vi.resetModules();
});
