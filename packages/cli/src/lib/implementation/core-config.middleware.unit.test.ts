import { describe, expect, vi } from 'vitest';
import { coreConfigMiddleware } from './core-config.middleware';

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

describe('configMiddleware', () => {
  it('should load code-pushup.config.(ts|mjs|js)', async () => {
    // It is indirectly testing if code-pushup.config.(ts|mjs|ts) is used.
    // The reason for this is a hard to setup test
    await expect(coreConfigMiddleware({})).rejects.toThrow(
      'No file code-pushup.config',
    );
  });
});
