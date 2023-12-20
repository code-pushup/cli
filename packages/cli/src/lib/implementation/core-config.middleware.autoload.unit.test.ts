import { vol } from 'memfs';
import { describe, expect } from 'vitest';
import { MINIMAL_CONFIG_MOCK } from '@code-pushup/testing-utils';
import { coreConfigMiddleware } from './core-config.middleware';

describe('configMiddleware-autoload', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };

    process.env['CP_SERVER'] = 'https://api.codepushup.com';
    process.env['CP_API_KEY'] = 'apiKey';
    process.env['CP_ORGANIZATION'] = 'org';
    process.env['CP_PROJECT'] = 'cli';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load code-pushup.config.(ts|mjs|js) by default', async () => {
    vol.fromJSON({
      // this is only needed to pass the file API's, the config is mocked in bundleRequire
      ['code-pushup.config.ts']: JSON.stringify(MINIMAL_CONFIG_MOCK),
    });
    const config = await coreConfigMiddleware({});
    expect(config?.upload?.project).toBe('cli');
  });
});
