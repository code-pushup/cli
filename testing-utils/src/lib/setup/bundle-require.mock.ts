import { vi } from 'vitest';

// Mock bundleRequire inside importEsmModule used for fetching config
vi.mock('bundle-require', async () => {
  const { CORE_CONFIG_MOCK }: typeof import('@code-pushup/testing-utils') =
    await vi.importActual('@code-pushup/testing-utils');
  return {
    bundleRequire: vi
      .fn()
      .mockResolvedValue({ mod: { default: CORE_CONFIG_MOCK } }),
  };
});
