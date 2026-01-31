import { vi } from 'vitest';
import type { importModule } from '@code-pushup/utils';

// Disable jiti caching in tests
vi.mock('@code-pushup/utils', async () => {
  const utils = (await vi.importActual('@code-pushup/utils')) as {
    importModule: typeof importModule;
  };
  return {
    ...utils,
    importModule: async (options: Parameters<typeof utils.importModule>[0]) => {
      return utils.importModule({
        ...options,
        cache: false,
      });
    },
  };
});
