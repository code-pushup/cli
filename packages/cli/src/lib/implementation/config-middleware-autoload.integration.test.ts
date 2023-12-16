import { vol } from 'memfs';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import { configMiddleware } from './config-middleware';

vi.mock('fs', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs;
});
vi.mock('fs/promises', async () => {
  const memfs: typeof import('memfs') = await vi.importActual('memfs');
  return memfs.fs.promises;
});

describe('configMiddleware-autoload', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        ['code-pushup.config.ts']: '{}',
      },
      '',
    );
  });

  afterEach(() => {
    vol.reset();
  });

  it('should load code-pushup.config.(ts|mjs|js) by default', async () => {
    const config = await configMiddleware({});
    expect(config?.upload?.project).toBe('cli');
  });
});
