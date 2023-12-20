import { vol } from 'memfs';
import { describe, expect } from 'vitest';
import { MINIMAL_CONFIG_MOCK } from '@code-pushup/testing-utils';
import { coreConfigMiddleware } from './core-config.middleware';

describe('configMiddleware-autoload', () => {
  it('should load code-pushup.config.(ts|mjs|js) by default', async () => {
    vol.fromJSON({
      // this is only needed to pass the file API's, the config is mocked in bundleRequire
      ['code-pushup.config.ts']: JSON.stringify(MINIMAL_CONFIG_MOCK),
    });
    const config = await coreConfigMiddleware({});
    expect(config?.upload?.project).toBe('cli');
  });
});
