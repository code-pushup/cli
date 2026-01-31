import { vi } from 'vitest';

// Disable jiti caching in tests
vi.mock('@code-pushup/utils', async () => {
  const utils = await vi.importActual('@code-pushup/utils');
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
